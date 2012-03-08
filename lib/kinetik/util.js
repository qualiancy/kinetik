var r = /(\d*.?\d+)([mshd]+)/
  , t = {}

t.ms = 1;
t.s = 1000;
t.m = t.s * 60;
t.h = t.m * 60;
t.d = t.h * 24;

exports.ms = function (s) {
  if (s == Number(s)) return Number(s);
  r.exec(s.toLowerCase());
  var res = RegExp.$1 * t[RegExp.$2];
  return (res === res) ? res : undefined;
}
