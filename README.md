![Logo](admin/raspilc.png)
# ioBroker.raspilc
=================

This adapter supports analog modules based on the MCP3204 or MCP3201 and MCP4921.

Install the adapter, activate the checkbox "Module inserted" and choose your
installed module.
Then choose the update interval for analog values and save the settings.

FRAM-support:
supports nonvolatile FRAM-devices (I2C-bus) FM24Cxx. In config-dialog you can
select ID's of datapoints (boolean or number) and choose the delay time for
reading back the values from FRAM. The adapter detects changes of the selected
datapoints and stores the values in FRAM. If the adapter or the whole system
restarts, the adapter waits the desired delay time and fires the values back
in ioBrokers datapoints. Numerical datapoints can have a value from 0 to 253,
that can stored in FRAM because only byte-access is realized in adapter and
All values will be rounded to integer.
Values larger than 253 will be ignored (should be enough for storing states
of dimmers or temperatures).   




TODO:

-Support for 4AO-module
-cleaning and optimizing code ;-)



## Changelog

### 0.1.2 (2018.10.14)
* (raspilc) FRAM-support added

### 0.0.1 (2018.10.06)
* (raspilc) initial release

## License
The MIT License (MIT)

Copyright (c) 2018 Ivo Lohs <info@raspilc.de>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
