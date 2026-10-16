/**
 * 播放器：用 requestAnimationFrame 驱动可视化器步进。
 *
 * 速度用「每秒步数」而不是「每帧步数」来表达，
 * 这样在不同刷新率的显示器上体感一致。
 */

export class Player {
  /**
   * @param {import('./base.js').BaseVisualizer} visualizer
   */
  constructor(visualizer) {
    this.visualizer = visualizer;
    this.playing = false;
    this.stepsPerSecond = 25;
    this._rafId = null;
    this._lastTs = 0;
    /** 累积的「不足一步」的零头，避免低速度下取整后一步都不走 */
    this._accumulator = 0;
    /** 剩余待走步数（用「单步」按钮触发的一次性动画） */
    this._pendingSingleStep = 0;
    this.onStateChange = null;
  }

  get minSpeed() {
    return 1;
  }

  get maxSpeed() {
    return 400;
  }

  play() {
    if (this.playing) return;
    if (this.visualizer.finished) this.visualizer.reset();
    this.playing = true;
    this._lastTs = 0;
    this._accumulator = 0;
    this._notify();
    this._loop();
  }

  pause() {
    if (!this.playing) return;
    this.playing = false;
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._notify();
  }

  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }

  /** 单步前进（带动画，一次走一步）。 */
  stepOnce() {
    this.pause();
    this._pendingSingleStep += 1;
    if (this._rafId === null && this._pendingSingleStep > 0) {
      this._lastTs = 0;
      this._accumulator = 0;
      this._loop();
    }
  }

  /** 连续走若干步，仍受速度约束。 */
  stepMany(count) {
    this.pause();
    this._pendingSingleStep += count;
    if (this._rafId === null && this._pendingSingleStep > 0) {
      this._lastTs = 0;
      this._accumulator = 0;
      this._loop();
    }
  }

  setSpeed(stepsPerSecond) {
    this.stepsPerSecond = Math.max(this.minSpeed, Math.min(this.maxSpeed, stepsPerSecond));
    this._notify();
  }

  _loop() {
    this._rafId = requestAnimationFrame((ts) => {
      this._rafId = null;
      if (this._lastTs === 0) this._lastTs = ts;
      // 限制单帧最大时间，避免切后台回来后突然快进一大段
      const delta = Math.min(ts - this._lastTs, 100);
      this._lastTs = ts;

      if (this.playing) {
        this._accumulator += (delta / 1000) * this.stepsPerSecond;
        const whole = Math.floor(this._accumulator);
        if (whole > 0) {
          this._accumulator -= whole;
          this.visualizer.step(whole);
        }
        if (this.visualizer.finished) {
          this.playing = false;
          this._notify();
          return; // 播放结束，停止循环
        }
        this._loop();
        return;
      }

      if (this._pendingSingleStep > 0) {
        // 单步模式：每帧走一步，速度上限交给调用方控制节奏
        this._accumulator += (delta / 1000) * Math.max(this.stepsPerSecond, 8);
        const whole = Math.floor(this._accumulator);
        if (whole > 0) {
          const take = Math.min(whole, this._pendingSingleStep);
          this._accumulator -= whole;
          this._pendingSingleStep -= take;
          this.visualizer.step(take);
        }
        if (this.visualizer.finished) {
          this._pendingSingleStep = 0;
          this._notify();
          return;
        }
        if (this._pendingSingleStep > 0) {
          this._loop();
        } else {
          this._notify();
        }
        return;
      }

      this._notify();
    });
  }

  _notify() {
    if (this.onStateChange) this.onStateChange({ playing: this.playing });
  }

  destroy() {
    if (this._rafId !== null) cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }
}
