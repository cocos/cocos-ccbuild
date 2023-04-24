# NOTE

this WASM is code in `C/C++` language, and compile with [emscripten](https://emscripten.org/)  
we use the compile option below
```sh
emcc helloworld.c -sEXPORTED_FUNCTIONS=_hello -sEXPORTED_RUNTIME_METHODS=cwrap,ccall -sMODULARIZE -sWASM=1 -sEXPORT_ES6=1 -o wasm_c.js
```

while we compile asm.js with option below
```sh
emcc helloworld.c -sEXPORTED_FUNCTIONS=_hello -sEXPORTED_RUNTIME_METHODS=cwrap,ccall -sMODULARIZE -sWASM=0 -sEXPORT_ES6=1 -o wasm_c.asm.js
```