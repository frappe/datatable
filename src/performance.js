class Performance {
  start() {
    this._start = window.performance.now();
  }

  end() {
    this._end = window.performance.now();
    console.log(this._end - this._start);
  }
}

let perf = new Performance();

export default perf;
