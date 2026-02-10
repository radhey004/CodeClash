FROM docker.io/library/node:20.13.0-alpine

ENV PYTHONUNBUFFERED=1
RUN set -ex && \
    apk add --no-cache gcc g++ musl-dev python3 openjdk17 ruby iptables ip6tables curl

RUN set -ex && \
    apk add --no-cache chromium lsof

# Create bits/stdc++.h header for competitive programming support
RUN mkdir -p /usr/include/bits && \
    echo '#ifndef _BITS_STDC_H\n\
#define _BITS_STDC_H\n\
#include <algorithm>\n\
#include <array>\n\
#include <bitset>\n\
#include <cassert>\n\
#include <cctype>\n\
#include <cerrno>\n\
#include <cfloat>\n\
#include <chrono>\n\
#include <ciso646>\n\
#include <climits>\n\
#include <clocale>\n\
#include <cmath>\n\
#include <complex>\n\
#include <csetjmp>\n\
#include <csignal>\n\
#include <cstdarg>\n\
#include <cstddef>\n\
#include <cstdint>\n\
#include <cstdio>\n\
#include <cstdlib>\n\
#include <cstring>\n\
#include <ctime>\n\
#include <cwchar>\n\
#include <cwctype>\n\
#include <deque>\n\
#include <exception>\n\
#include <forward_list>\n\
#include <fstream>\n\
#include <functional>\n\
#include <initializer_list>\n\
#include <iomanip>\n\
#include <ios>\n\
#include <iosfwd>\n\
#include <iostream>\n\
#include <istream>\n\
#include <iterator>\n\
#include <limits>\n\
#include <list>\n\
#include <locale>\n\
#include <map>\n\
#include <memory>\n\
#include <new>\n\
#include <numeric>\n\
#include <ostream>\n\
#include <queue>\n\
#include <random>\n\
#include <ratio>\n\
#include <regex>\n\
#include <set>\n\
#include <sstream>\n\
#include <stack>\n\
#include <stdexcept>\n\
#include <streambuf>\n\
#include <string>\n\
#include <system_error>\n\
#include <tuple>\n\
#include <type_traits>\n\
#include <typeinfo>\n\
#include <unordered_map>\n\
#include <unordered_set>\n\
#include <utility>\n\
#include <valarray>\n\
#include <vector>\n\
#endif' > /usr/include/bits/stdc++.h

RUN set -ex && \
    rm -f /usr/libexec/gcc/x86_64-alpine-linux-musl/6.4.0/cc1obj && \
    rm -f /usr/libexec/gcc/x86_64-alpine-linux-musl/6.4.0/lto1 && \
    rm -f /usr/libexec/gcc/x86_64-alpine-linux-musl/6.4.0/lto-wrapper && \
    rm -f /usr/bin/x86_64-alpine-linux-musl-gcj

RUN ln -sf python3 /usr/bin/python

ADD . /usr/bin/
ADD start.sh /usr/bin/

RUN npm --prefix /usr/bin/ install
EXPOSE 8080

# add a dummy user that will run the server, hence sandboxing the rest of the container
RUN addgroup -S -g 2000 runner && adduser -S -D -u 2000 -s /sbin/nologin -h /tmp -G runner runner
#   USER runner
WORKDIR /usr/bin
CMD ["npm", "start"]
