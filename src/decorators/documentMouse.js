import React from 'react';

const documentMouse = (options = {}) => (
  Component => (
    class DocumentMouseProvider extends React.Component {

      componentWillMount() {
        this.onMouseDown = ::this.onMouseDown;
        this.onMouseMove = ::this.onMouseMove;
        this.onMouseUp = ::this.onMouseUp;
        this.onMouseWheel = ::this.onMouseWheel;
        document.addEventListener('mousedown', this.onMouseDown);
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
        document.body.addEventListener('mousewheel', this.onMouseWheel);
      }

      componentWillUnmount() {
        document.removeEventListener('mousedown', this.onMouseDown);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
        document.body.removeEventListener('mousewheel', this.onMouseWheel);
      }

      onMouseDown(evt) {
        this.ref.mouseX0 = evt.clientX;
        this.ref.mouseY0 = evt.clientY;
        this.mouseX = evt.clientX;
        this.mouseY = evt.clientY;
        if (typeof this.onMouseDownEvt === 'function') this.onMouseDownEvt(evt);
        if (this.scrollRef) {
          this.scrollRefPos0 = this.scrollRef.getBoundingClientRect();
        }
      }

      onMouseMove(evt) {
        let scrollX = 0;
        let scrollY = 0;
        this.mouseX = evt.clientX;
        this.mouseY = evt.clientY;
        if (this.scrollRef && this.scrollRefPos0) {
          const pos = this.scrollRef.getBoundingClientRect();
          scrollX = pos.left - this.scrollRefPos0.left;
          scrollY = pos.top - this.scrollRefPos0.top;
        }
        if (typeof this.onMouseMoveEvt === 'function') {
          this.onMouseMoveEvt(evt.clientX - this.ref.mouseX0 - scrollX, evt.clientY - this.ref.mouseY0 - scrollY, evt);
        }
      }

      onMouseWheel(evt) {
        if (this.scrollRef && this.scrollRefPos0) {
          const func = () => {
            const pos = this.scrollRef.getBoundingClientRect();
            const scrollX = pos.left - this.scrollRefPos0.left;
            const scrollY = pos.top - this.scrollRefPos0.top;
            if (typeof this.onMouseMoveEvt === 'function') {
              this.onMouseMoveEvt(this.mouseX - this.ref.mouseX0 - scrollX, this.mouseY - this.ref.mouseY0 - scrollY, evt);
            }
          };
          setTimeout(func, 500);
        }
      }

      onMouseUp(evt) {
        if (typeof this.onMouseUpEvt === 'function') this.onMouseUpEvt(evt);
      }

      render() {
        return (
          <Component
            ref={(ref) => {
              if (!ref) return;
              this.ref = ref;
              this.onMouseDownEvt = typeof ref.onMouseDown === 'function' ? ref.onMouseDown.bind(ref) : null;
              this.onMouseMoveEvt = typeof ref.onMouseMove === 'function' ? ref.onMouseMove.bind(ref) : null;
              this.onMouseUpEvt = typeof ref.onMouseUp === 'function' ? ref.onMouseUp.bind(ref) : null;
            }}
            setScrollRef={(DOM) => {
              this.scrollRef = DOM;
            }}
            {...this.props}
          />
        );
      }
    }
  )
);
export default documentMouse;
