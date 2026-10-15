#!/usr/bin/env bash
cd -- "$(dirname -- "$0")"
bash start.sh || { read -r -p 'Press Enter to close…' _; exit 1; }
