/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-present eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

import {Transform} from "stream";
import path from "path";

function changePath(destination, custom = {})
{
  if (custom.cwd)
    destination = path.join(custom.cwd, destination);

  const transform = new Transform({objectMode: true});

  transform._transform = (file, encoding, cb) =>
  {
    if (custom.match && file.path.match(custom.match))
    {
      file.path = path.join(destination,
                            file.relative.replace(custom.match, custom.replace)
      );
    }
    else if (custom.rename)
    {
      file.path = destination;
    }
    else
    {
      file.path = path.join(destination, file.relative);
    }

    file.base = null;
    cb(null, file);
  };

  return transform;
}

export default changePath;
