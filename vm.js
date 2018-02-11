/*
  VM:
  	レジスタ: A, PC
        Memory: 配列
  					getchar
  putchar
  load c
  jump n
  eval function(){ ... }
*/

function create_vm(program, outfn) {
  return { a: null, pc: 0, memory: program, outfn: outfn, running: true, kbd_buf: [] };
}
function step(vm) {
  if (vm.pc < 0 || vm.pc >= vm.memory.length)
    throw new Error("pc out of range: " + vm.pc);
  var inst = vm.memory[vm.pc];
  if (!(typeof(inst) == 'object' && inst instanceof Array))
    throw new Error("type error");
  var [op, ...operands] = inst;
  switch (op) {
  case "getchar":
    if (vm.kbd_buf.length == 0) {
      vm.running = false;
      break;
    } else {
      vm.a = vm.kbd_buf.shift();
      vm.pc++;
      break;
    }
  case "putchar":
    vm.outfn(vm.a);
    vm.pc++;
    break;
  case "load":
    vm.a = operands[0];
    vm.pc++;
    break;
  case "jump":
    vm.pc = operands[0];
    break;
  case "terpri":
    vm.outfn("\r\n");
    vm.pc++;
    break;
  case "inc":
    vm.a++;
    vm.pc++;
    break;
  default:
    throw new Error("unknown op: " + op);
  }
}

// $(function () {
//   var vm = create_vm([
//     ["load", 1],
//     ["putchar"],
//     ["inc"],
//     ["jump", 1]
//   ]);

//   var cb = function () {
//     step(vm);
//     setTimeout(cb, 0);
//   };
//   setTimeout(cb, 0);
// });
