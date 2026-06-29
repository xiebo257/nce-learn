#!/usr/bin/env node
import { verifyBookPlayer } from './verify_book_player.mjs';

verifyBookPlayer({
  book: 'NCE3',
  htmlDir: 'NCE3/html',
  expectedCount: 60,
});
