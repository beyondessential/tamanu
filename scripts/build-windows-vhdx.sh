#!/usr/bin/env bash
# Build a dynamically-sized NTFS VHDX disk image containing a Tamanu Windows
# release bundle, entirely in userspace (no root, no kernel NTFS driver, no
# loopback mount) using libguestfs. The resulting VHDX can be attached directly
# by Windows/Hyper-V or packed as an OCI artifact (see cd.yml windows-image job).
#
# Usage: scripts/build-windows-vhdx.sh <release-dir> <output.vhdx> [volume-label]
#   release-dir:  the release bundle root (its whole tree is copied onto the disk)
#   output.vhdx:  path to write the VHDX image to
#   volume-label: optional NTFS volume label (default: Tamanu)
#
# Requires: qemu-utils and libguestfs-tools (guestfish) on the PATH.
set -euo pipefail

release_dir="${1:?Expected release directory}"
output="${2:?Expected output VHDX path}"
label="${3:-Tamanu}"
# guestfish tokenises its command args on whitespace, so an NTFS volume label
# with spaces would break the mkfs call. Normalise to a single token.
label="${label// /-}"

if [ ! -d "$release_dir" ]; then
  echo "release directory '$release_dir' does not exist" >&2
  exit 1
fi

# libguestfs runs a small qemu appliance; use the direct backend so we don't
# depend on libvirt being configured on the runner. Fall back to software
# emulation transparently when the runner has no /dev/kvm.
export LIBGUESTFS_BACKEND=direct

# Size the disk from the bundle contents: NTFS metadata, cluster slack, and a
# little headroom for attaching read-write. 40% overhead + 512 MiB floor, then
# round up to a whole MiB (VHDX likes MiB-aligned virtual sizes).
bundle_bytes="$(du -sb "$release_dir" | cut -f1)"
mib=$(( 1024 * 1024 ))
disk_bytes=$(( bundle_bytes * 140 / 100 + 512 * mib ))
disk_mib=$(( (disk_bytes + mib - 1) / mib ))

echo "Bundle is $(( bundle_bytes / mib )) MiB; provisioning a ${disk_mib} MiB NTFS VHDX at ${output}"

# VHDX is a dynamic (sparse) format, so the on-disk file only grows to the data
# actually written, not the full virtual size.
qemu-img create -f vhdx "$output" "${disk_mib}M" >/dev/null

# Partition (MBR), format NTFS, mount, and copy the bundle in. copy-in places
# the release-dir itself under the volume root, mirroring the layout inside the
# release .tar/.zip artifacts (a top-level release-vX.Y.Z/ directory).
guestfish --format=vhdx -a "$output" <<EOF
run
part-disk /dev/sda mbr
part-set-mbr-id /dev/sda 1 0x07
mkfs ntfs /dev/sda1 label:${label}
mount /dev/sda1 /
copy-in ${release_dir} /
umount /
EOF

echo "Built NTFS VHDX: $(ls -lh "$output" | awk '{print $5}') on-disk (${disk_mib} MiB virtual)"
