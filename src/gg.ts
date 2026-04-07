#!/usr/bin/env node

process.argv.splice(2, 0, '--auto_release', "--push");

import('./index');