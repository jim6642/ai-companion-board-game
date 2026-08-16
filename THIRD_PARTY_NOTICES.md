# Third-Party Notices

## Heart Letter / Love Letter rule and bot references

The local classic four-player rule engine in `src/lib/love-letter/engine.ts`
implements the public rules described by the official Z-Man Games rulebook:

- [Love Letter rulebook](https://cdn.svc.asmodee.net/production-zman/uploads/2026/04/LL_Rulebook_with_Bag.pdf)

The engine uses an original local TypeScript state model. Its bot move ordering
was informed by the probability and priority ideas in:

- [brucehow/loveletter](https://github.com/brucehow/loveletter) — Copyright (c) 2019 Bruce How — MIT License
- [kst179/LoveLetter](https://github.com/kst179/LoveLetter) — MIT License

No upstream code, names, card art, icons, board layout, or other visual assets are
included. The playable page uses the original product name “心动密函”.

## Aeroplane Chess / Ludo rule references

The local rule engine in `src/lib/aeroplane/engine.ts` adapts state transitions,
exact-finish movement, capture/return-to-base behavior, bonus turns, and local
bot-selection ideas from these projects:

- [avirati/ludo](https://github.com/avirati/ludo) — Copyright (c) 2020 Avinash Virat — MIT License
- [RoJac88/ludo-js](https://github.com/RoJac88/ludo-js) — Copyright (c) 2021 RoJac88 — MIT License

The implementation was converted to the local TypeScript state model and extended
with Chinese Aeroplane Chess colour jumps and a cross-board shortcut. No upstream
visual assets are included.

### MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
