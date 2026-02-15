import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { battleAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Clock, Code, Send, CheckCircle, XCircle, User, Trophy, Zap, ChevronRight, Play, Settings, RotateCcw, Award, Target } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { getLanguageConfig, getStarterCode } from '../config/languages';
import EditorialModal from '../components/EditorialModal';

interface TestCase {
  input: string;
  isHidden: boolean;
}

interface Problem {
  title: string;
  description: string;
  difficulty: string;
  constraints: string[];
  testCases: TestCase[];
  timeLimit: number;
  xpReward?: number;
}

interface Battle {
  _id: string;
  players: Array<{ _id: string; username: string; level: number }>;
  problem: Problem;
  status: string;
  winner?: { _id: string; username: string };
  startedAt: string;
}

const Arena = () => {
  const { battleId } = useParams<{ battleId: string }>();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [battle, setBattle] = useState<Battle | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('c');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [opponent, setOpponent] = useState<any>(null);
  const [opponentStatus, setOpponentStatus] = useState<string>('Coding...');
  const [battleComplete, setBattleComplete] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'submission'>('description');
  const [opponentLeft, setOpponentLeft] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // Percentage
  const [showTabSwitchWarning, setShowTabSwitchWarning] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showEditorial, setShowEditorial] = useState(false);
  const [editorialData, setEditorialData] = useState<any>(null);
  const [myScore, setMyScore] = useState<any>(null);
  const [opponentScore, setOpponentScore] = useState<any>(null);
  const [timeExpired, setTimeExpired] = useState(false);
  const [opponentFinished, setOpponentFinished] = useState(false);
  const [lastChanceTime, setLastChanceTime] = useState(0);
  const [xpReward, setXpReward] = useState<any>(null);
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isLeavingBattle = useRef<boolean>(false);

  // Prevent re-entry to already left battles
  useEffect(() => {
    if (!battleId) return;
    
    const leftBattles = sessionStorage.getItem('leftBattles');
    if (leftBattles) {
      const leftBattlesArray = JSON.parse(leftBattles);
      if (leftBattlesArray.includes(battleId)) {
        // This battle was already left, redirect immediately
        navigate('/dashboard', { replace: true });
      }
    }
  }, [battleId, navigate]);

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
    // Remove auto-focus to prevent scroll
    // editor.focus();
  };

  // Add useEffect to scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

  // Also ensure left panel scrolls to top when battle loads
  useEffect(() => {
    if (battle) {
      const leftPanel = document.querySelector('.overflow-y-auto');
      if (leftPanel) {
        leftPanel.scrollTop = 0;
      }
    }
  }, [battle]);

  // Fullscreen mode management
  useEffect(() => {
    let listenerAttached = false;

    // Handle fullscreen changes (when user exits fullscreen via browser controls)
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !battleComplete && listenerAttached) {
        setShowLeaveConfirm(true);
        setPendingNavigation('fullscreen-exit');
      }
    };

    // Add listener after a delay to avoid triggering during page navigation
    // User is already in fullscreen from matchmaking page
    const timeoutId = setTimeout(() => {
      listenerAttached = true;
      document.addEventListener('fullscreenchange', handleFullscreenChange);
    }, 2000);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      // Exit fullscreen when component unmounts
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((error) => {
          console.error('Failed to exit fullscreen on unmount:', error);
        });
      }
    };
  }, [battleComplete]);

  // Handle ESC key to trigger leave battle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !battleComplete) {
        e.preventDefault();
        setShowLeaveConfirm(true);
        setPendingNavigation('escape-key');
      }
      // Detect Alt+Tab, Ctrl+Tab, Windows key, etc.
      if (!battleComplete && (
        (e.altKey && e.key === 'Tab') ||
        (e.ctrlKey && e.key === 'Tab') ||
        (e.metaKey && e.key === 'Tab') ||
        e.key === 'Meta' ||
        e.key === 'Alt'
      )) {
        e.preventDefault();
        handleTabSwitch();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [battleComplete, tabSwitchCount]);

  // Handle tab switch detection and auto-redirect after 3 warnings
  const handleTabSwitch = () => {
    const newCount = tabSwitchCount + 1;
    setTabSwitchCount(newCount);
    
    if (newCount >= 3) {
      // Automatically leave battle after 3 warnings
      handleAutoLeaveAfterWarnings();
    } else {
      // Show warning modal
      setShowTabSwitchWarning(true);
    }
  };

  const handleAutoLeaveAfterWarnings = async () => {
    setBattleComplete(true);
    
    // Emit leave event to socket
    if (socket && battleId && user) {
      socket.emit('leave-battle', { battleId, userId: user._id });
    }
    
    // Navigate to dashboard
    await navigateToDashboard();
  };

  // Prevent tab switching during battle
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !battleComplete) {
        handleTabSwitch();
      }
    };

    const handleBlur = () => {
      if (!battleComplete && !showLeaveConfirm && !showTabSwitchWarning) {
        handleTabSwitch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [battleComplete, showLeaveConfirm, showTabSwitchWarning, tabSwitchCount]);

  // Smooth resizer logic
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((moveEvent.clientX - containerRect.left) / containerRect.width) * 100;
      
      // Constrain between 30% and 70%
      if (newWidth >= 30 && newWidth <= 70) {
        requestAnimationFrame(() => {
          setLeftPanelWidth(newWidth);
        });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Prevent browser back/refresh/close during battle
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!battleComplete) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [battleComplete]);

  useEffect(() => {
    if (battleComplete) return;

    const handlePopState = (e: PopStateEvent) => {
      if (!battleComplete) {
        e.preventDefault();
        window.history.pushState(null, '', window.location.href);
        setShowLeaveConfirm(true);
        setPendingNavigation('back');
      }
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [battleComplete]);

  // Helper function to clean up history and navigate to dashboard
  const navigateToDashboard = async () => {
    // Mark this battle as left to prevent re-entry
    if (battleId) {
      const leftBattles = sessionStorage.getItem('leftBattles');
      const leftBattlesArray = leftBattles ? JSON.parse(leftBattles) : [];
      if (!leftBattlesArray.includes(battleId)) {
        leftBattlesArray.push(battleId);
        sessionStorage.setItem('leftBattles', JSON.stringify(leftBattlesArray));
      }
    }
    
    // Exit fullscreen before navigating
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
        // Wait for fullscreen to fully exit
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        console.error('Failed to exit fullscreen:', err);
      }
    }
    
    // Navigate to dashboard and replace history entry
    navigate('/dashboard', { replace: true });
  };

  const handleConfirmLeave = async () => {
    setShowLeaveConfirm(false);
    setBattleComplete(true);
    
    // Ensure fullscreen is exited before navigating
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (err) {
        console.error('Failed to exit fullscreen:', err);
      }
    }
    
    // Add a small delay to ensure fullscreen transition is complete
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Clean up history and navigate to dashboard
    await navigateToDashboard();
  };

  const handleCancelLeave = async () => {
    setShowLeaveConfirm(false);
    setPendingNavigation(null);
    // Re-enter fullscreen if user cancels leaving
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      console.error('Failed to re-enter fullscreen:', error);
    }
  };

  // Mark battle as left when it completes
  useEffect(() => {
    if (battleComplete && battleId) {
      const leftBattles = sessionStorage.getItem('leftBattles');
      const leftBattlesArray = leftBattles ? JSON.parse(leftBattles) : [];
      if (!leftBattlesArray.includes(battleId)) {
        leftBattlesArray.push(battleId);
        sessionStorage.setItem('leftBattles', JSON.stringify(leftBattlesArray));
      }
    }
  }, [battleComplete, battleId]);

  useEffect(() => {
    (window as any).battleInProgress = !battleComplete;
    (window as any).showBattleLeaveConfirm = () => {
      if (!battleComplete) {
        setShowLeaveConfirm(true);
        setPendingNavigation('navbar');
      }
    };
    
    // Exit fullscreen when battle completes
    const exitFullscreenOnComplete = async () => {
      if (battleComplete && document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch (error) {
          console.error('Failed to exit fullscreen:', error);
        }
      }
    };
    
    exitFullscreenOnComplete();
    
    return () => {
      (window as any).battleInProgress = false;
      (window as any).showBattleLeaveConfirm = null;
    };
  }, [battleComplete]);

  useEffect(() => {
    if (!battleId || !user?._id) {
      console.error('Missing battleId or user data');
      navigate('/dashboard', { replace: true });
      return;
    }

    loadBattle();
    
    const newSocket = io(import.meta.env.VITE_COMPILER_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to battle server');
      if (battleId && user?._id) {
        newSocket.emit('join-battle', { battleId, userId: user._id });
        newSocket.emit('user-online', { userId: user._id, username: user.username });
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    newSocket.on('error', ({ message }) => {
      console.error('Battle error:', message);
      if (message && message !== 'Battle not found or already completed') {
        // Only show non-standard errors
        alert(`Error: ${message}`);
      }
    });

    newSocket.on('opponent-typing', ({ codeLength }) => {
      if (!battleComplete) {
        setOpponentStatus(`Coding... (${codeLength} chars)`);
      }
    });

    newSocket.on('opponent-submitted', ({ passed, testCasesPassed, totalTestCases, score }) => {
      if (battleComplete) return;
      
      const status = passed 
        ? `\u2713 Completed (${testCasesPassed}/${totalTestCases}) - Score: ${score || 0}`
        : `\u2717 Failed (${testCasesPassed}/${totalTestCases}) - Score: ${score || 0}`;
      
      setOpponentStatus(status);
      setOpponentScore(score || 0);
    });

    newSocket.on('opponent-finished', ({ message, timeRemaining }) => {
      setOpponentFinished(true);
      setLastChanceTime(timeRemaining);
      setOpponentStatus('\uD83C\uDFAF SOLVED! - Last chance!');
    });

    newSocket.on('submission-result', (data) => {
      if (!data) {
        console.error('Received empty submission result');
        setSubmitting(false);
        return;
      }

      console.log('Submission result:', data);
      setResult(data);
      setMyScore(data.score?.totalScore || 0);
      setSubmitting(false);
      setActiveTab('submission');
      setShowResultModal(true);
      
      if (data.isWinner) {
        setIsWinner(true);
      }
      
      if (data.battleCompleted) {
        setBattleComplete(true);
      }
      
      // Handle practice mode editorial when all test cases pass
      if (data.isPractice && data.solved && data.editorial) {
        // Ensure editorial is an object (not a string from old data)
        const editorialObj = typeof data.editorial === 'string' 
          ? {
              summary: data.editorial,
              approach: '',
              optimalSolution: '',
              timeComplexity: 'N/A',
              spaceComplexity: 'N/A',
              keyTakeaways: [],
              commonMistakes: []
            }
          : data.editorial;
        
        setEditorialData({
          editorial: editorialObj,
          aiImprovements: {
            player1: data.aiImprovements || []
          },
          winner: user?.username
        });
      }
    });

    newSocket.on('battle-complete', ({ winner, opponentLeft, editorial, aiImprovements, playerCodes, timeExpired, lastChanceExpired, xpChanges }) => {
      console.log('Battle complete event received:', { winner, opponentLeft, timeExpired, lastChanceExpired });
      console.log('Editorial received:', editorial);
      
      setBattleComplete(true);
      
      if (opponentLeft) {
        setOpponentLeft(true);
      }
      if (timeExpired || lastChanceExpired) {
        setTimeExpired(true);
      }
      
      // Store XP reward for current user
      if (xpChanges && user?._id) {
        const userXp = xpChanges[user._id];
        if (userXp) {
          setXpReward(userXp);
        }
      }
      
      // Store editorial data for later display
      // Ensure editorial is an object (not a string from old data)
      if (editorial) {
        const editorialObj = typeof editorial === 'string' 
          ? {
              summary: editorial,
              approach: '',
              optimalSolution: '',
              timeComplexity: 'N/A',
              spaceComplexity: 'N/A',
              keyTakeaways: [],
              commonMistakes: []
            }
          : editorial;
        
        setEditorialData({
          editorial: editorialObj,
          aiImprovements,
          playerCodes,
          winner: winner?.username
        });
      }
      
      // Determine if current user won
      const isCurrentUserWinner = winner && user && (winner._id === user._id || winner.toString() === user._id);
      
      setIsWinner(!!isCurrentUserWinner);
      setShowResultModal(true);
      
      // Update user data
      fetch(`${import.meta.env.VITE_COMPILER_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          updateUser(data);
        }
      })
      .catch(err => console.error('Failed to update user data:', err));
    });

    return () => {
      console.log('Cleaning up socket connection');
      newSocket.off('connect');
      newSocket.off('connect_error');
      newSocket.off('disconnect');
      newSocket.off('error');
      newSocket.off('opponent-typing');
      newSocket.off('opponent-submitted');
      newSocket.off('opponent-finished');
      newSocket.off('submission-result');
      newSocket.off('battle-complete');
      newSocket.disconnect();
    };
  }, [battleId, user?._id]);

  // Timer countdown effect
  useEffect(() => {
    if (battle && timeLeft > 0 && !battleComplete) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [battle, timeLeft, battleComplete]);

  // Last chance timer countdown
  useEffect(() => {
    if (opponentFinished && lastChanceTime > 0 && !battleComplete) {
      const timer = setInterval(() => {
        setLastChanceTime((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [opponentFinished, lastChanceTime, battleComplete]);

  const loadBattle = async () => {
    try {
      if (!battleId) {
        throw new Error('No battle ID provided');
      }

      console.log('Loading battle:', battleId);
      const data = await battleAPI.getBattle(battleId);
      
      if (!data) {
        throw new Error('No battle data received');
      }

      if (!data.players || data.players.length === 0) {
        throw new Error('Invalid battle data: no players');
      }

      if (!data.problem) {
        throw new Error('Invalid battle data: no problem');
      }

      console.log('Battle loaded successfully:', data);
      setBattle(data);

      const opponentData = data.players.find((p: any) => p._id !== user?._id);
      if (opponentData) {
        setOpponent(opponentData);
      } else {
        console.warn('No opponent found in battle data');
      }

      const elapsed = Math.floor((Date.now() - new Date(data.startedAt).getTime()) / 1000);
      const remaining = Math.max(0, data.problem.timeLimit - elapsed);
      setTimeLeft(remaining);

      setCode(getStarterCode(language, data.problem.title));
    } catch (error) {
      console.error('Failed to load battle:', error);
      alert('Battle not found or failed to load. Returning to dashboard.');
      await navigateToDashboard();
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (battle) {
      setCode(getStarterCode(newLang, battle.problem.title));
    }
  };

  const handleSubmit = async () => {
    if (battleComplete) {
      alert('Battle is already complete');
      return;
    }
    
    if (!code.trim()) {
      alert('Please write some code first');
      return;
    }
    
    if (!socket || !socket.connected) {
      alert('Not connected to server. Please refresh the page.');
      return;
    }
    
    if (!user?._id) {
      alert('User session expired. Please login again.');
      navigate('/login');
      return;
    }

    setResult(null);
    setSubmitting(true);
    
    console.log('Submitting code...', { battleId, userId: user._id, language });
    
    setTimeout(() => {
      if (socket && socket.connected) {
        socket.emit('submit-code', {
          battleId,
          userId: user._id,
          code,
          language
        });
      } else {
        setSubmitting(false);
        alert('Connection lost. Please try again.');
      }
    }, 1000);
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    
    if (socket && socket.connected && battleId && user?._id && !battleComplete) {
      socket.emit('code-update', {
        battleId,
        userId: user._id,
        code: newCode
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading battle...</div>
      </div>
    );
  }

  if (!battle) return null;

  return (
    <div className="h-screen bg-[#1a1a1a] flex flex-col overflow-hidden">
      {/* Modals */}
      
      {showTabSwitchWarning && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-[#282828] border border-yellow-600 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-yellow-600/20 rounded-full flex items-center justify-center mr-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h2 className="text-xl font-bold text-yellow-400">Tab Switch Detected!</h2>
            </div>
            <p className="text-gray-300 mb-4">
              You have attempted to switch tabs or windows during the battle.
            </p>
            <p className="text-red-400 font-semibold mb-6">
              Warning: Multiple violations will result in automatic disqualification and removal from the arena.
            </p>
            <button
              onClick={() => {
                setShowTabSwitchWarning(false);
                window.focus();
                // Re-enter fullscreen if exited
                if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                  document.documentElement.requestFullscreen().catch(() => {});
                }
              }}
              className="w-full bg-yellow-600 text-white px-4 py-3 rounded hover:bg-yellow-700 transition-colors font-semibold"
            >
              I Understand - Continue Battle
            </button>
          </div>
        </div>
      )}

      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#282828] border border-gray-700 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Leave Match?</h2>
            <p className="text-gray-400 mb-6">
              Are you sure you want to leave? You will not be able to rejoin this battle.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancelLeave}
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLeave}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {showResultModal && (result || opponentLeft || battleComplete) && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`bg-[#282828] border-2 rounded-lg p-8 max-w-lg w-full ${
            (result?.success || opponentLeft || isWinner) ? 'border-green-500' : 'border-red-500'
          }`}>
            <div className="text-center mb-6">
              {opponentLeft ? (
                <>
                  <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-yellow-400 mb-2">
                    🏆 Victory by Forfeit!
                  </h2>
                  <p className="text-gray-400">
                    Your opponent left the battle
                  </p>
                </>
              ) : timeExpired && isWinner ? (
                <>
                  <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-yellow-400 mb-2">
                    🏆 Victory!
                  </h2>
                  <p className="text-gray-400">
                    Time expired - You had the higher score!
                  </p>
                </>
              ) : timeExpired && !isWinner && battleComplete ? (
                <>
                  <XCircle className="w-20 h-20 text-red-400 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-red-400 mb-2">Time's Up</h2>
                  <p className="text-gray-400">
                    {result ? 'Your opponent had a higher score' : 'You did not submit a solution'}
                  </p>
                </>
              ) : battleComplete && !isWinner && !result ? (
                <>
                  <XCircle className="w-20 h-20 text-red-400 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-red-400 mb-2">Defeat</h2>
                  <p className="text-gray-400">
                    Your opponent solved the problem first
                  </p>
                </>
              ) : result?.success ? (
                <>
                  <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-green-400 mb-2">
                    {result.isWinner ? '🏆 Victory!' : 'Accepted'}
                  </h2>
                  <p className="text-gray-400">
                    {result.testCasesPassed} / {result.totalTestCases} test cases passed
                  </p>
                </>
              ) : result ? (
                <>
                  <XCircle className="w-20 h-20 text-red-400 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-red-400 mb-2">Wrong Answer</h2>
                  <p className="text-gray-400">
                    {result?.testCasesPassed} / {result?.totalTestCases} test cases passed
                  </p>
                </>
              ) : null}
            </div>

            {(result?.isWinner || opponentLeft) && xpReward && (
              <div className="space-y-3 mb-4">
                {xpReward.mode === 'ranked' ? (
                  <>
                    <div className={`${xpReward.rankedXP > 0 ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'} border rounded-lg p-4`}>
                      <p className={`${xpReward.rankedXP > 0 ? 'text-green-400' : 'text-red-400'} text-center font-bold text-lg`}>
                        {xpReward.rankedXP > 0 ? '+' : ''}{xpReward.rankedXP} Ranked XP 🏆
                      </p>
                      <p className="text-gray-400 text-center text-sm mt-1">Ranked Match</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-3">
                      <p className="text-blue-400 text-center font-semibold">
                        +{xpReward.regularXP} XP (Level Progress)
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="bg-cyan-500/10 border border-cyan-500 rounded-lg p-4">
                    <p className="text-cyan-400 text-center font-semibold">
                      +{xpReward.regularXP} XP Earned!
                    </p>
                    <p className="text-gray-400 text-center text-sm mt-1">Practice Match</p>
                  </div>
                )}
              </div>
            )}

            {!result?.isWinner && !opponentLeft && xpReward && (
              <div className="space-y-3 mb-4">
                {xpReward.mode === 'ranked' ? (
                  <>
                    <div className={`${xpReward.rankedXP < 0 ? 'bg-red-500/10 border-red-500' : 'bg-gray-500/10 border-gray-500'} border rounded-lg p-4`}>
                      <p className={`${xpReward.rankedXP < 0 ? 'text-red-400' : 'text-gray-400'} text-center font-bold text-lg`}>
                        {xpReward.rankedXP} Ranked XP
                      </p>
                      <p className="text-gray-400 text-center text-sm mt-1">Ranked Match</p>
                    </div>
                    {xpReward.regularXP > 0 && (
                      <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-3">
                        <p className="text-blue-400 text-center font-semibold">
                          +{xpReward.regularXP} XP (Consolation)
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  xpReward.regularXP > 0 && (
                    <div className="bg-cyan-500/10 border border-cyan-500 rounded-lg p-4">
                      <p className="text-cyan-400 text-center font-semibold">
                        +{xpReward.regularXP} XP
                      </p>
                      <p className="text-gray-400 text-center text-sm mt-1">Practice Match</p>
                    </div>
                  )
                )}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setShowResultModal(false)}
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              {battleComplete && editorialData && (
                <button
                  onClick={() => {
                    setShowResultModal(false);
                    setShowEditorial(true);
                  }}
                  className="flex-1 bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700 transition-colors flex items-center justify-center"
                >
                  <Award className="w-4 h-4 mr-2" />
                  View Editorial
                </button>
              )}
              {battleComplete && !editorialData && (
                <button
                  onClick={() => navigateToDashboard()}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                >
                  Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Bar - Battle Info */}
      <div className="bg-[#282828] border-b border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowLeaveConfirm(true)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <div className="flex items-center space-x-2">
              <h1 className="text-white font-medium">{battle.problem.title}</h1>
              <span className={`text-xs px-2 py-0.5 rounded ${
                battle.problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                battle.problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {battle.problem.difficulty}
              </span>
            </div>
          </div>

          {/* Submit Button - Center */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSubmit}
              disabled={submitting || battleComplete}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded font-medium transition-colors flex items-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Submit</span>
                </>
              )}
            </button>

            {/* Last Chance Timer */}
            {opponentFinished && !battleComplete && (
              <div className="bg-orange-600 border-2 border-orange-400 rounded-lg px-4 py-2 shadow-lg animate-pulse">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-white" />
                  <div>
                    <div className="text-white font-bold text-sm">\uD83C\uDFAF Opponent Solved!</div>
                    <div className="text-orange-100 text-xs">
                      {lastChanceTime > 0 ? `${lastChanceTime}s remaining!` : 'Submit now!'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-6">
            {/* Players */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-xs text-white">
                  {user?.username[0].toUpperCase()}
                </div>
                <span className="text-sm text-white">{user?.username}</span>
                {isWinner && <Trophy className="w-4 h-4 text-yellow-400" />}
              </div>
              {battle.players.length > 1 && (
                <>
                  <span className="text-gray-600">vs</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                      {opponent?.username[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-white">{opponent?.username}</span>
                    {battleComplete && !isWinner && <Trophy className="w-4 h-4 text-yellow-400" />}
                  </div>
                </>
              )}
            </div>

            {/* Timer */}
            <div className="flex items-center space-x-2 bg-[#1a1a1a] px-3 py-1 rounded">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-white font-mono text-sm">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        {/* Left Panel - Problem Description */}
        <div 
          className="bg-[#1a1a1a] border-r border-gray-700 flex flex-col transition-none"
          style={{ width: `${leftPanelWidth}%` }}
        >
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('description')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'description'
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('submission')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'submission'
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Result
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'description' ? (
              <div className="text-gray-300 space-y-4">
                <div className="prose prose-invert max-w-none">
                  <p className="whitespace-pre-wrap leading-relaxed">{battle.problem.description}</p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-white font-medium">Example:</h3>
                  {battle.problem.testCases.filter(tc => !tc.isHidden).map((tc, i) => (
                    <div key={i} className="bg-[#282828] rounded-lg p-3 font-mono text-sm">
                      <div className="text-gray-400 mb-1">Input:</div>
                      <div className="text-white">{tc.input}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h3 className="text-white font-medium">Constraints:</h3>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {battle.problem.constraints.map((constraint, i) => (
                      <li key={i} className="text-gray-400">{constraint}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div>
                {result ? (
                  <div className="space-y-4">
                    <div className={`border-l-4 p-4 rounded ${
                      result.success ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'
                    }`}>
                      <div className="flex items-center space-x-2 mb-2">
                        {result.success ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        <span className={`font-semibold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                          {result.success ? 'Accepted' : 'Wrong Answer'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        {result.testCasesPassed} / {result.totalTestCases} test cases passed
                      </p>
                    </div>

                    {result.results && result.results.length > 0 && (
                      <div className="space-y-3 mt-4">
                        <div className="flex items-center justify-between px-1">
                          <h4 className="text-white font-semibold text-sm">Test Cases</h4>
                          <span className="text-xs text-gray-400">
                            {result.results.filter((r: any) => r.passed).length} / {result.results.length} Passed
                          </span>
                        </div>
                        <div className="space-y-2">
                          {result.results.map((testResult: any, idx: number) => (
                            <div key={idx} className={`bg-[#1e1e1e] rounded-lg border ${
                              testResult.passed ? 'border-green-500/30' : 'border-red-500/30'
                            } overflow-hidden`}>
                              {/* Header */}
                              <div className={`px-4 py-2.5 flex items-center justify-between ${ testResult.passed ? 'bg-green-500/10' : 'bg-red-500/10'
                              }`}>
                                <div className="flex items-center space-x-2">
                                  {testResult.passed ? (
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-400" />
                                  )}
                                  <span className="text-sm font-medium text-white">
                                    Test Case {idx + 1}
                                  </span>
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded font-semibold ${
                                  testResult.passed 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {testResult.statusDescription || (testResult.passed ? 'Accepted' : 'Wrong Answer')}
                                </span>
                              </div>
                              
                              {/* Content */}
                              <div className="px-4 py-3 space-y-3">
                                {/* Input Preview */}
                                {testResult.inputPreview && (
                                  <div>
                                    <div className="text-xs font-semibold text-gray-400 mb-1.5">Input</div>
                                    <div className="bg-[#282828] rounded px-3 py-2 border border-gray-700">
                                      <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                                        {testResult.inputPreview.length > 100 ? testResult.inputPreview.substring(0, 100) + '...' : testResult.inputPreview}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Error Display */}
                                {testResult.error && (
                                  <div>
                                    <div className="text-xs font-semibold text-red-400 mb-1.5">Error</div>
                                    <div className="bg-red-900/20 border border-red-500/30 rounded px-3 py-2">
                                      <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap">{testResult.error}</pre>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Output Comparison for Wrong Answer */}
                                {!testResult.passed && testResult.expected && !testResult.error?.includes('Compilation Error') && !testResult.error?.includes('Runtime Error') && !testResult.error?.includes('Time Limit') && !testResult.error?.includes('Memory Limit') && (
                                  <div className="space-y-2">
                                    <div>
                                      <div className="text-xs font-semibold text-gray-400 mb-1.5">Expected Output</div>
                                      <div className="bg-[#282828] rounded px-3 py-2 border border-gray-700">
                                        <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">{testResult.expected || '(empty)'}</pre>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs font-semibold text-gray-400 mb-1.5">Your Output</div>
                                      <div className="bg-[#282828] rounded px-3 py-2 border border-gray-700">
                                        <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">{testResult.output || '(empty)'}</pre>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Runtime and Memory Stats - LeetCode Style */}
                                {testResult.time > 0 && (
                                  <div className="flex items-center gap-4 text-xs pt-2 border-t border-gray-700">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-gray-400">Runtime:</span>
                                      <span className="text-white font-medium">{testResult.time.toFixed(3)}s</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-gray-400">Memory:</span>
                                      <span className="text-white font-medium">{(testResult.memory / 1024).toFixed(2)} KB</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    No submissions yet
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resizer */}
        <div
          className="w-1 bg-gray-700 hover:bg-cyan-500 cursor-col-resize transition-colors flex-shrink-0"
          onMouseDown={handleMouseDown}
        />

        {/* Right Panel - Code Editor */}
        <div className="flex-1 bg-[#1e1e1e] flex flex-col min-w-0">
          {/* Editor Header */}
          <div className="bg-[#282828] border-b border-gray-700 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Code className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Code</span>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-[#1a1a1a] text-white text-sm border border-gray-700 rounded px-3 py-1 focus:outline-none focus:border-cyan-500"
              >
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={getLanguageConfig(language).monacoLang}
              value={code}
              onChange={(value) => handleCodeChange(value || '')}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                readOnly: battleComplete,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                bracketPairColorization: { enabled: true },
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                padding: { top: 16, bottom: 16 }
              }}
            />
          </div>

          
        </div>
      </div>

      {/* Editorial Modal */}
      {showEditorial && editorialData && battle && (
        <EditorialModal
          editorial={editorialData.editorial}
          playerNames={{
            player1: battle.players[0]?.username,
            player2: battle.players[1]?.username
          }}
          aiImprovements={editorialData.aiImprovements}
          playerCodes={editorialData.playerCodes}
          winner={editorialData.winner}
          onClose={async () => {
            setShowEditorial(false);
            await navigateToDashboard();
          }}
        />
      )}
    </div>
    
  );
};

export default Arena;
