import { useEffect, useState, CSSProperties, useCallback } from "react";
import { useSwipeable, EventData, SwipeableHandlers } from "react-swipeable";

import {
  getTranslateXDistance,
  getNextIndex,
  getPreviousIndex,
  getContainerWidth,
  getLeftOffset
} from "./utils";

interface Config {
  swipeThreshold: number;
  swipeLimit: number;
  transitionSpeed: number;
}

interface Animations {
  elastic: string;
  smooth: string;
}

const swipeConfig: Config = {
  swipeThreshold: 0.3,
  swipeLimit: 1.2,
  transitionSpeed: 400
};

const swipeAnimations: Animations = {
  elastic: `transform ${swipeConfig.transitionSpeed}ms cubic-bezier(0.075, 0.82, 0.165, 1)`,
  smooth: `transform ${swipeConfig.transitionSpeed}ms cubic-bezier(0.075, 0.82, 0.165, 1)`
};

enum SwipeDirection {
  Left = 1,
  Right = -1
}

interface UseSwipeProps {
  length: number;
  interval: number;
  childWidthPercent: number;
  autoScroll?: boolean;
  alignCenter?: boolean;
}

const useSwipe = ({
  length,
  interval,
  childWidthPercent,
  autoScroll = true,
  alignCenter = false
}: UseSwipeProps): {
  current: number;
  slideTo: (index: number) => void;
  slideToNext: () => void;
  slideToPrev: () => void;
  containerProps: SwipeableHandlers | {};
  animationStyles: CSSProperties;
} => {
  const [targetIndex, setTargetIndex] = useState(0);
  const [current, setCurrent] = useState(0);
  const [offset, setOffset] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(true);

  const slideToNext = useCallback(
    () => setTargetIndex(getNextIndex(length, current)),
    [length, current]
  );

  const slideToPrev = useCallback(
    () => setTargetIndex(getPreviousIndex(length, current)),
    [length, current]
  );

  const slideTo = (index: number): void => {
    setTargetIndex(index);
    setShouldAnimate(false);
  };

  const handleSwipe = (event: EventData, direction: number): void => {
    const element = event.event.target;
    const width = (element as HTMLElement).clientWidth;
    const threshold = width * swipeConfig.swipeThreshold;
    const delta = event.deltaX * direction;

    if (delta >= threshold) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      direction > 0 ? slideToNext() : slideToPrev();
    } else {
      setOffset(0);
    }
  };

  const containerProps = useSwipeable({
    onSwiping(e: EventData) {
      const sign = e.deltaX > 0 ? SwipeDirection.Right : SwipeDirection.Left;
      const element = e.event.target;
      const width = (element as HTMLElement).clientWidth;
      const calcOffset =
        sign * Math.min(Math.abs(e.deltaX), swipeConfig.swipeLimit * width);

      setOffset(calcOffset);
    },
    onSwipedLeft(e: EventData) {
      handleSwipe(e, SwipeDirection.Left);
    },
    onSwipedRight(e: EventData) {
      handleSwipe(e, SwipeDirection.Right);
    },
    trackMouse: true,
    trackTouch: true
  });

  useEffect(() => {
    const id = setTimeout(() => autoScroll && slideToNext(), interval);
    return () => clearTimeout(id);
  }, [offset, current, autoScroll, interval, slideToNext]);

  useEffect(() => {
    const id = setTimeout(
      () => {
        setCurrent(targetIndex);
        setOffset(NaN);
        setShouldAnimate(true);
      },
      shouldAnimate ? swipeConfig.transitionSpeed : 0
    );

    return () => clearTimeout(id);
  }, [shouldAnimate, targetIndex]);

  const animationStyles: CSSProperties = {
    transform: "translateX(0)",
    width: `${getContainerWidth(childWidthPercent, length)}%`,
    left: `-${getLeftOffset(childWidthPercent, current, alignCenter)}%`
  };

  if (shouldAnimate && targetIndex !== current) {
    animationStyles.transition = swipeAnimations.smooth;
    animationStyles.transform = `translateX(${getTranslateXDistance(
      length,
      current,
      targetIndex,
      offset
    )}%)`;
  } else if (!Number.isNaN(offset)) {
    if (offset !== 0) {
      animationStyles.transform = `translateX(${offset}px)`;
    } else {
      animationStyles.transition = swipeAnimations.elastic;
    }
  }

  return {
    current: targetIndex,
    slideTo,
    slideToNext,
    slideToPrev,
    animationStyles,
    containerProps
  };
};

export default useSwipe;
