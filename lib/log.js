const fs = require("fs");

class Log {
  constructor(file) {
    this.file = file;
  }
  // only print log in console
  log(text) {
    console.log(`${text}\n`);
  }

  // print cutting line
  line(char = "-", only_log = false) {
    if (!only_log) {
      this.write(char.repeat(40));
    } else {
      this.log(char);
    }
  }

  // print log in console, local file
  write(text) {
    this.log(text);
    fs.writeFileSync(this.file, `${text}\n`, { flag: "a" });
  }

  // clear local log file content
  clear() {
    fs.writeFileSync(this.file, "");
  }
}

export { Log };
