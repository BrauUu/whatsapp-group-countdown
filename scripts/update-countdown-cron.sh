#!/usr/bin/env bash

set -euo pipefail

script_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repository_directory="$(cd -- "${script_directory}/.." && pwd)"
lock_file="${TMPDIR:-/tmp}/wpp-bot-gta-vi-date.lock"

cd -- "${repository_directory}"

exec 9>"${lock_file}"
if ! flock -n 9; then
  echo 'Outra atualização já está em execução; encerrando.' >&2
  exit 0
fi

exec npm run update-countdown
