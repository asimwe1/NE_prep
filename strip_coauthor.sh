#!/bin/sh
grep -v "^Co-authored-by:" | sed '/^$/d'
