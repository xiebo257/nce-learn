#!/usr/bin/env node
import { verifyBookPlayer } from './verify_book_player.mjs';

verifyBookPlayer({
  book: 'NCE2',
  htmlDir: 'NCE2/html',
  expectedCount: 96,
});
