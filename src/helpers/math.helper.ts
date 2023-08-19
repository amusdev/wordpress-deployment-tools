export default {
  random: function (length: number, { lower = true, upper = true, numeric = true, symbol = false } = {}) {
    let mask = '';
    if (lower) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (upper) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (numeric) mask += '0123456789';
    if (symbol) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
    let result = '';
    for (var i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)];
    return result;
  }
}