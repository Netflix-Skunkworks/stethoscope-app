#!/usr/bin/env kmd
exec cat /etc/apt/apt.conf.d/20auto-upgrades
save output
extract APT::Periodic::Update-Package-Lists "(\d)";
defaultTo 0
save updates.configDataInstall

load output
extract APT::Periodic::Unattended-Upgrade "(\d)";
defaultTo 0
save updates.criticalUpdateInstall

remove output
save updates
