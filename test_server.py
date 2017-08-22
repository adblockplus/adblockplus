#!/usr/bin/env python

# This file is part of Adblock Plus <https://adblockplus.org/>,
# Copyright (C) 2006-present eyeo GmbH
#
# Adblock Plus is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License version 3 as
# published by the Free Software Foundation.
#
# Adblock Plus is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.

import os
import SimpleHTTPServer
import SocketServer

PORT = ("127.0.0.1", 5000)

SocketServer.TCPServer.allow_reuse_address = True
httpd = SocketServer.TCPServer(PORT, SimpleHTTPServer.SimpleHTTPRequestHandler)

if __name__ == "__main__":
    print "Starting web server at http://%s:%i/" % PORT
    os.chdir(os.path.dirname(__file__))
    httpd.serve_forever()
