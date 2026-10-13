#!/usr/bin/env bash

set -euo pipefail

repository_directory="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
auth_directory="${BAILEYS_AUTH_DIR:-${repository_directory}/.auth/baileys}"
output_file="${BAILEYS_AUTH_ARCHIVE:-${repository_directory}/.github/secure/baileys-auth.tar.gz.gpg}"

if [[ ! -d "${auth_directory}" || ! -f "${auth_directory}/creds.json" ]]; then
  echo "Sessão Baileys não encontrada em ${auth_directory}." >&2
  echo 'Execute npm run update-countdown localmente e conclua a autenticação pelo QR Code.' >&2
  exit 1
fi

if [[ -n "${BAILEYS_AUTH_PASSPHRASE:-}" ]]; then
  passphrase="${BAILEYS_AUTH_PASSPHRASE}"
else
  read -r -s -p 'Passphrase para cifrar a sessão: ' passphrase
  printf '\n' >&2
  read -r -s -p 'Repita a passphrase: ' confirmation
  printf '\n' >&2

  if [[ "${passphrase}" != "${confirmation}" ]]; then
    echo 'As passphrases não coincidem.' >&2
    exit 1
  fi
fi

temporary_directory="$(mktemp -d)"
trap 'rm -rf -- "${temporary_directory}"; unset passphrase confirmation' EXIT

passphrase_file="${temporary_directory}/passphrase"
archive_file="${temporary_directory}/baileys-auth.tar.gz"
printf '%s' "${passphrase}" > "${passphrase_file}"
chmod 600 "${passphrase_file}"

tar --create --gzip \
  --file "${archive_file}" \
  --directory "${auth_directory}" .

mkdir -p "$(dirname -- "${output_file}")"
gpg --batch --yes --quiet --no-symkey-cache \
  --pinentry-mode loopback \
  --passphrase-file "${passphrase_file}" \
  --cipher-algo AES256 \
  --output "${output_file}" \
  --symmetric "${archive_file}"

chmod 600 "${output_file}"
echo "Arquivo de sessão cifrado criado em ${output_file}."
echo 'Configure a mesma passphrase no secret BAILEYS_AUTH_PASSPHRASE do GitHub Actions.'
