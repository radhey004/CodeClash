// Language configuration for CodeClash

export const SUPPORTED_LANGUAGES = {
  c: {
    name: 'C',
    monacoLang: 'c',
    extension: '.c',
    compilerLang: 'c',
    icon: '📘',
    starterTemplate: (title: string) => `// ${title}
// Read input and write output to match expected format

#include <stdio.h>

int main() {
    // Example: Two Sum - reading array and target
    int nums[100], n = 0, target;
    
    // Read numbers until newline
    while (scanf("%d", &nums[n]) == 1) {
        n++;
        if (getchar() == '\\n') break;
    }
    scanf("%d", &target);
    
    // Your solution here - print result
    printf("0 1");  // Replace with actual indices
    return 0;
}`
  },
  cpp: {
    name: 'C++',
    monacoLang: 'cpp',
    extension: '.cpp',
    compilerLang: 'cpp',
    icon: '📗',
    starterTemplate: (title: string) => `// ${title}
// Read input and write output to match expected format

#include <iostream>
#include <vector>
using namespace std;

int main() {
    // Example: Two Sum - reading array and target
    vector<int> nums;
    int num;
    
    // Read first line of numbers
    while (cin >> num) {
        nums.push_back(num);
        if (cin.peek() == '\\n') break;
    }
    
    int target;
    cin >> target;
    
    // Your solution here - print result
    cout << "0 1";  // Replace with actual indices
    return 0;
}`
  },
  java: {
    name: 'Java',
    monacoLang: 'java',
    extension: '.java',
    compilerLang: 'java',
    icon: '☕',
    starterTemplate: (title: string) => `// ${title}
// Read input and write output to match expected format

import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        
        // Example: Two Sum - reading array and target
        String[] numStrs = sc.nextLine().split(" ");
        int[] nums = new int[numStrs.length];
        for (int i = 0; i < numStrs.length; i++) {
            nums[i] = Integer.parseInt(numStrs[i]);
        }
        int target = sc.nextInt();
        
        // Your solution here - print result
        System.out.println("0 1");  // Replace with actual indices
        sc.close();
    }
}`
  },
  python: {
    name: 'Python',
    monacoLang: 'python',
    extension: '.py',
    compilerLang: 'python',
    icon: '🐍',
    starterTemplate: (title: string) => `# ${title}
# Read input and write output to match expected format

# Example: Two Sum - reading array and target
nums = list(map(int, input().split()))
target = int(input())

# Your solution here
print("0 1")  # Replace with actual indices`
  },
  javascript: {
    name: 'JavaScript (Node.js)',
    monacoLang: 'javascript',
    extension: '.js',
    compilerLang: 'nodejs',
    icon: '🟨',
    starterTemplate: (title: string) => `// ${title}
// Read input from stdin and write output

const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const lines = [];
rl.on('line', (line) => {
    lines.push(line);
});

rl.on('close', () => {
    // Example: Two Sum - reading array and target
    const nums = lines[0].split(' ').map(Number);
    const target = parseInt(lines[1]);
    
    // Your solution here
    console.log("0 1");  // Replace with actual indices
});`
  }
};

export type LanguageKey = keyof typeof SUPPORTED_LANGUAGES;

export const getLanguageConfig = (lang: string) => {
  return SUPPORTED_LANGUAGES[lang as LanguageKey] || SUPPORTED_LANGUAGES.python;
};

export const getStarterCode = (lang: string, problemTitle: string) => {
  const config = getLanguageConfig(lang);
  return config.starterTemplate(problemTitle);
};
