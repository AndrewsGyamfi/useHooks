import {
  useRef,
  useCallback,
  useLayoutEffect,
  useState,
  CSSProperties,
  useEffect,
  RefObject
} from "react";

enum Directions {
  left = -1,
  right = 1
}

interface UseScrollProps {
  startIndex: number;
}

interface Navigation {
  next: boolean;
  prev: boolean;
}

interface Animations {
  elastic: string;
  smooth: string;
}

const transitionDuration = 400;

const useScroll = ({
  startIndex = 0
}: UseScrollProps): {
  containerRef: RefObject<HTMLDivElement>;
  contentRef: RefObject<HTMLDivElement>;
  scrollLeft: () => void;
  scrollRight: () => void;
  animationStyles: CSSProperties;
  navigation: Navigation;
} => {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [widths, setWidths] = useState([0]);
  const [maxLeftScroll, setMaxLeftScroll] = useState(0);
  const [maxLeftReached, setMaxLeftReached] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [targetIndex, setTargetIndex] = useState(startIndex);
  const [lastAllowedIndex, setLastAllowedIndex] = useState(0);
  const [leftPosition, setLeftPosition] = useState(0);
  const showNextNav = widths.length > 1 && contentWidth > containerWidth;
  const [navigation, setNavigation] = useState<Navigation>({
    next: showNextNav,
    prev: false
  });

  const willExceedMaxScroll = (xDistance = 0): boolean =>
    xDistance + leftPosition > maxLeftScroll;

  const getLeftPosition = useCallback(
    (index: number): number => {
      return index === 0
        ? 0
        : widths.slice(0, index).reduce((acc, current) => acc + current, 0);
    },
    [widths]
  );

  const getScrollRightTranslateX = (targetXDistance: number): number => {
    const targetLeftPosition = getLeftPosition(targetIndex);

    return willExceedMaxScroll()
      ? maxLeftScroll - targetLeftPosition
      : targetXDistance;
  };

  const getScrollLeftTranslateX = (targetXDistance: number): number =>
    willExceedMaxScroll(targetXDistance)
      ? maxLeftScroll - leftPosition
      : targetXDistance;

  const getTranslateX = (index: number, direction: Directions): number => {
    const targetXDistance =
      widths[direction === Directions.left ? index : index - 1];

    if (direction === Directions.left) {
      return getScrollLeftTranslateX(targetXDistance) * Directions.left;
    }

    return getScrollRightTranslateX(targetXDistance) * Directions.right;
  };

  const scrollLeft = useCallback(
    () => setTargetIndex(Math.max(0, currentIndex - 1)),
    [currentIndex]
  );

  const scrollRight = useCallback(
    () => setTargetIndex(maxLeftReached ? lastAllowedIndex : currentIndex + 1),
    [maxLeftReached, lastAllowedIndex, currentIndex]
  );

  useLayoutEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef?.current.clientWidth);
    }

    if (contentRef.current) {
      const content = contentRef?.current as HTMLElement;

      const children = Array.from(content.children);

      const widthsList = children.map(
        child => (child as HTMLElement).offsetWidth
      );

      const totalContentWidth = widthsList.reduce(
        (acc, current) => acc + current,
        0
      );

      setWidths(widthsList);
      setContentWidth(totalContentWidth);
    }
  }, []);

  useEffect(() => {
    setMaxLeftScroll(contentWidth - containerWidth);
  }, [contentWidth, containerWidth]);

  useEffect(() => {
    const id = setTimeout(() => {
      const nextLeftPosition = getLeftPosition(targetIndex + 1);

      setCurrentIndex(targetIndex);
      setLeftPosition(getLeftPosition(targetIndex));
      setMaxLeftReached(Boolean(nextLeftPosition > maxLeftScroll));
    }, transitionDuration);

    return () => clearTimeout(id);
  }, [targetIndex, getLeftPosition, maxLeftScroll]);

  useEffect(() => {
    setNavigation({
      prev: currentIndex > 0,
      next:
        showNextNav && !(lastAllowedIndex && currentIndex === lastAllowedIndex)
    });
  }, [currentIndex, lastAllowedIndex, showNextNav]);

  useEffect(() => {
    if (maxLeftReached && !lastAllowedIndex) {
      setLastAllowedIndex(currentIndex + 1);
    }
  }, [maxLeftReached, lastAllowedIndex, currentIndex]);

  const scrollDirection =
    targetIndex > currentIndex ? Directions.left : Directions.right;

  const animationStyles: CSSProperties = {
    width: `${contentWidth}px`,
    left: `-${Math.min(maxLeftScroll, getLeftPosition(currentIndex))}px`
  };

  if (targetIndex !== currentIndex) {
    animationStyles.transition = `transform ${transitionDuration}ms cubic-bezier(0.075, 0.82, 0.165, 1)`;
    animationStyles.transform = `translateX(${getTranslateX(
      currentIndex,
      scrollDirection
    )}px)`;
  }

  return {
    containerRef,
    contentRef,
    scrollLeft,
    scrollRight,
    animationStyles,
    navigation
  };
};

export default useScroll;
