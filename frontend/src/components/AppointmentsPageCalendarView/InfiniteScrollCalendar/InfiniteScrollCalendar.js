import { Box } from '@mui/material';
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { appointmentStatusEnum } from '@/enums/enums';

const TIME_SLOT_HEIGHT = 56; // Height of each 30-min slot
const DAYS_TO_RENDER = 30; // Рендерим 30 дней (месяц) для скролла
const PRELOAD_THRESHOLD = 5; // Когда осталось 5 дней до края, подгружаем еще

export default function InfiniteScrollCalendar({
  appointments = [],
  onDateRangeChange,
  minHour = 9,
  maxHour = 20,
  visibleDays = 1,
  onEventClick,
  onTodayRef,
}) {
  const scrollContainerRef = useRef(null);
  const headerRef = useRef(null);
  const wrapperRef = useRef(null);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(DAYS_TO_RENDER / 2));
    return date;
  });
  const [containerWidth, setContainerWidth] = useState(0);
  const [, setScrollLeft] = useState(0);
  const isInitialized = useRef(false);
  const scrollEndTimer = useRef(null);
  const lastLoadTime = useRef(0);
  const lastScrollPosition = useRef(0);
  const isScrolling = useRef(false);
  const isProgrammaticScroll = useRef(false);

  // Calculate column width based on container width and visible days
  const columnWidth = useMemo(() => {
    if (!containerWidth || visibleDays === 0) return 120;
    return Math.floor(containerWidth / visibleDays);
  }, [containerWidth, visibleDays]);

  // Calculate total hours and slots
  const totalHours = maxHour - minHour;
  const totalSlots = totalHours * 2; // 30-min slots

  // Generate array of dates to render
  const visibleDateRange = useMemo(() => {
    const dates = [];
    for (let index = 0; index < DAYS_TO_RENDER; index++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + index);
      dates.push(date);
    }

    return dates;
  }, [startDate, visibleDays, columnWidth, containerWidth]);

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped = {};
    appointments.forEach((appointment) => {
      const dateKey = new Date(appointment.timeStart).toISOString().slice(0, 10);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(appointment);
    });
    return grouped;
  }, [appointments]);

  // Handle scroll - infinite loading with header sync and snap-to-column
  const handleScroll = useCallback((event) => {
    const container = event.target;
    const newScrollLeft = container.scrollLeft;
    const clientWidth = container.clientWidth;

    // Ignore programmatic scroll events
    if (isProgrammaticScroll.current) {
      console.log(`⏭️ Ignoring programmatic scroll:`, newScrollLeft);
      return;
    }

    // Track when scrolling starts (user-initiated only)
    if (!isScrolling.current) {
      isScrolling.current = true;
      lastScrollPosition.current = newScrollLeft;
      console.log(`🟢 Scroll START:`, JSON.stringify({
        startPosition: newScrollLeft,
        columnWidth,
        visibleDays,
      }, null, 2));
    }

    // Clear previous snap timer
    if (scrollEndTimer.current) {
      clearTimeout(scrollEndTimer.current);
    }

    // Set new snap timer
    scrollEndTimer.current = setTimeout(() => {
      handleScrollEnd();
    }, 150); // Snap after 150ms of no scrolling

    // Update scroll state for header sync
    setScrollLeft(newScrollLeft);

    // Sync header scroll
    if (headerRef.current) {
      headerRef.current.scrollLeft = newScrollLeft;
    }

    const scrolledDays = Math.floor(newScrollLeft / columnWidth);
    const remainingDays = DAYS_TO_RENDER - scrolledDays - visibleDays;

    // Load more days when approaching the end (with sliding window approach)
    if (remainingDays < PRELOAD_THRESHOLD) {
      const now = Date.now();
      const timeSinceLastLoad = now - lastLoadTime.current;
      const MIN_LOAD_INTERVAL = 300; // Minimum 300ms between loads

      if (timeSinceLastLoad > MIN_LOAD_INTERVAL) {
        // Calculate current scroll position in days from start
        const currentScrollDays = Math.floor(newScrollLeft / columnWidth);

        // Only load if we're actually near the end and within reasonable limits
        const today = new Date();
        const currentViewDate = new Date(startDate);
        currentViewDate.setDate(currentViewDate.getDate() + currentScrollDays);

        // Limit to max 2 months from today
        const maxAllowedDate = new Date(today);
        maxAllowedDate.setMonth(maxAllowedDate.getMonth() + 2);

        if (currentViewDate <= maxAllowedDate) {
          // Slide the window by only a few days to maintain scroll position
          const slideAmount = Math.min(PRELOAD_THRESHOLD, 7); // Max 7 days slide
          const newStartDate = new Date(startDate);
          newStartDate.setDate(newStartDate.getDate() + slideAmount);

          // Sliding window logic without excessive logging

          // Adjust scroll position to maintain current view
          const scrollAdjustment = slideAmount * columnWidth;

          setStartDate(newStartDate);
          lastLoadTime.current = now;

          // Maintain scroll position after state update
          setTimeout(() => {
            if (scrollContainerRef.current && headerRef.current) {
              const adjustedScrollLeft = Math.max(0, newScrollLeft - scrollAdjustment);
              scrollContainerRef.current.scrollLeft = adjustedScrollLeft;
              headerRef.current.scrollLeft = adjustedScrollLeft;

            }
          }, 50);

        }
      }
    }

    // Notify parent about current date range (debounced)
    if (onDateRangeChange) {
      const centerDayIndex = Math.floor((newScrollLeft + clientWidth / 2) / columnWidth);
      const centerDay = new Date(startDate);
      centerDay.setDate(centerDay.getDate() + centerDayIndex);

      const rangeStart = new Date(centerDay);
      rangeStart.setDate(rangeStart.getDate() - Math.floor(visibleDays / 2));
      const rangeEnd = new Date(rangeStart);
      rangeEnd.setDate(rangeEnd.getDate() + visibleDays);

      // Simple debounce - only call if day actually changed
      const currentDayKey = centerDay.toISOString().slice(0, 10);
      if (currentDayKey !== handleScroll.lastDayKey) {
        handleScroll.lastDayKey = currentDayKey;
        onDateRangeChange(rangeStart, rangeEnd);
      }
    }
  }, [startDate, columnWidth, visibleDays, onDateRangeChange]);

  // Handle scroll end - snap to nearest column with limit
  const handleScrollEnd = useCallback(() => {
    if (!scrollContainerRef.current || columnWidth === 0) return;

    const container = scrollContainerRef.current;
    const currentScrollLeft = container.scrollLeft;

    // Calculate how far we scrolled from the last position
    const scrollDelta = currentScrollLeft - lastScrollPosition.current;
    const scrolledColumns = Math.abs(scrollDelta) / columnWidth;

    console.log(`🔴 Scroll END:`, JSON.stringify({
      lastPosition: lastScrollPosition.current,
      currentPosition: currentScrollLeft,
      scrollDelta,
      scrolledColumns,
      visibleDays,
      columnWidth,
      willLimit: scrolledColumns > visibleDays,
    }, null, 2));

    // Limit scroll to maximum 1 view (visibleDays) per swipe - like Google Calendar
    let targetScrollLeft;

    if (scrolledColumns > visibleDays) {
      // If scrolled more than one view, limit it to one view
      const maxScroll = visibleDays * columnWidth;
      const direction = scrollDelta > 0 ? 1 : -1;
      const limitedScrollLeft = lastScrollPosition.current + (maxScroll * direction);

      // Snap to nearest column from limited position
      const nearestColumnIndex = Math.round(limitedScrollLeft / columnWidth);
      targetScrollLeft = nearestColumnIndex * columnWidth;

      console.log(`⚠️ LIMIT Applied:`, JSON.stringify({
        maxScroll,
        direction: direction > 0 ? `forward` : `backward`,
        limitedScrollLeft,
        nearestColumnIndex,
        targetScrollLeft,
      }, null, 2));
    } else {
      // Normal snap to nearest column
      const nearestColumnIndex = Math.round(currentScrollLeft / columnWidth);
      targetScrollLeft = nearestColumnIndex * columnWidth;

      console.log(`✅ Normal Snap:`, JSON.stringify({
        nearestColumnIndex,
        targetScrollLeft,
      }, null, 2));
    }

    // Update last scroll position
    lastScrollPosition.current = targetScrollLeft;
    isScrolling.current = false;

    console.log(`🎯 Final Snap:`, JSON.stringify({
      from: currentScrollLeft,
      to: targetScrollLeft,
      difference: Math.abs(currentScrollLeft - targetScrollLeft),
      willScroll: Math.abs(currentScrollLeft - targetScrollLeft) > 1,
    }, null, 2));

    // Only snap if there's a significant difference
    if (Math.abs(currentScrollLeft - targetScrollLeft) > 1) {
      // Set flag to ignore programmatic scroll events
      isProgrammaticScroll.current = true;

      // Only scroll the main container - header will sync via handleScroll event
      container.scrollTo({
        left: targetScrollLeft,
        behavior: `smooth`,
      });

      // Clear flag after animation completes (smooth scroll takes ~300-500ms)
      setTimeout(() => {
        isProgrammaticScroll.current = false;
        console.log(`✅ Programmatic scroll complete, re-enabled user scroll`);
      }, 600);
    }
  }, [columnWidth, visibleDays]);

  // Measure container width from actual scroll container
  useEffect(() => {
    const measureWidth = () => {
      if (headerRef.current) {
        // Use header width (without scrollbar) for accurate measurement
        const headerWidth = headerRef.current.clientWidth;
        const width = Math.max(headerWidth, 300); // Minimum 300px
        setContainerWidth(width);
      } else {
        // Fallback to viewport calculation if container not ready
        const viewportWidth = window.innerWidth;
        const padding = 32;
        const width = Math.max(viewportWidth - padding, 300);


        setContainerWidth(width);
      }
    };

    // Initial measurement with small delay to ensure DOM is ready
    const timer = setTimeout(measureWidth, 100);

    measureWidth();
    window.addEventListener(`resize`, measureWidth);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(`resize`, measureWidth);
    };
  }, [visibleDays]);

  // Initialize scroll position to today
  useEffect(() => {
    if (!isInitialized.current && scrollContainerRef.current && headerRef.current && columnWidth > 0) {
      const todayIndex = Math.floor(DAYS_TO_RENDER / 2);
      const initialScrollLeft = todayIndex * columnWidth;

      // Sync both containers
      scrollContainerRef.current.scrollLeft = initialScrollLeft;
      headerRef.current.scrollLeft = initialScrollLeft;
      setScrollLeft(initialScrollLeft);

      // Set initial scroll position for limit tracking
      lastScrollPosition.current = initialScrollLeft;

      isInitialized.current = true;
    }
  }, [columnWidth]);

  // Reset when view changes
  useEffect(() => {
    isInitialized.current = false;
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(DAYS_TO_RENDER / 2));
    setStartDate(date);
  }, [visibleDays]);

  // Function to scroll to today
  const scrollToToday = useCallback(() => {
    const today = new Date();
    const todayDateString = today.toISOString().slice(0, 10);

    // Find today's index in current visible range
    let todayIndex = -1;
    for (let i = 0; i < DAYS_TO_RENDER; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      if (date.toISOString().slice(0, 10) === todayDateString) {
        todayIndex = i;
        break;
      }
    }

    if (todayIndex === -1) {
      // Today is not in current range, reset the date range
      const newStartDate = new Date(today);
      newStartDate.setDate(newStartDate.getDate() - Math.floor(DAYS_TO_RENDER / 2));
      setStartDate(newStartDate);

      // After state update, scroll to center
      setTimeout(() => {
        const centerIndex = Math.floor(DAYS_TO_RENDER / 2);
        const targetScrollLeft = centerIndex * columnWidth;
        if (scrollContainerRef.current) {
          // Only scroll main container - header will sync via handleScroll event
          scrollContainerRef.current.scrollTo({
            left: targetScrollLeft,
            behavior: `smooth`,
          });
        }
      }, 100);
    } else {
      // Today is in current range, just scroll to it
      const targetScrollLeft = todayIndex * columnWidth;
      if (scrollContainerRef.current) {
        // Only scroll main container - header will sync via handleScroll event
        scrollContainerRef.current.scrollTo({
          left: targetScrollLeft,
          behavior: `smooth`,
        });
      }
    }
  }, [startDate, columnWidth]);

  // Expose scrollToToday function to parent
  useEffect(() => {
    if (onTodayRef) {
      onTodayRef.current = scrollToToday;
    }
  }, [scrollToToday, onTodayRef]);

  // Force measurement after initial render
  useEffect(() => {
    if (headerRef.current && containerWidth === 0) {
      const timer = setTimeout(() => {
        const headerWidth = headerRef.current?.clientWidth;
        if (headerWidth && headerWidth > 0) {
          const width = Math.max(headerWidth, 300);
          setContainerWidth(width);
        }
      }, 200); // Longer delay to ensure DOM is ready

      return () => clearTimeout(timer);
    }
  }, [containerWidth, visibleDays]);

  return (
    <Box
      ref={wrapperRef}
      sx={{
        height: `calc(100vh - 216px)`,
        display: `flex`,
        flexDirection: `column`,
        overflow: `hidden`,
        width: `100%`,
        maxWidth: `100vw`,
      }}
    >
      {/* Header with day names */}
      <Box
        sx={{
          display: `flex`,
          borderBottom: `1px solid rgba(0,0,0,0.1)`,
          position: `sticky`,
          top: 0,
          backgroundColor: `white`,
          zIndex: 10,
        }}
      >
        {/* Time column header */}
        <Box
          sx={{
            width: `60px`,
            minWidth: `60px`,
            borderRight: `1px solid rgba(0,0,0,0.08)`,
            backgroundColor: `rgba(0,0,0,0.02)`,
          }}
        />

        {/* Scrollable day headers */}
        <Box
          ref={headerRef}
          sx={{
            display: `flex`,
            overflowX: `auto`, // Allow scrolling for sync
            flex: 1,
            pointerEvents: `none`, // Disable user interaction
            '&::-webkit-scrollbar': {
              display: `none`,
            },
            scrollbarWidth: `none`,
          }}
        >
          {visibleDateRange.map((date, index) => {
            const isToday = isSameDay(date, new Date());

            return (
              <Box
                key={`header-${index}`}
                sx={{
                  width: `${columnWidth}px`,
                  minWidth: `${columnWidth}px`,
                  padding: `12px 8px`,
                  textAlign: `center`,
                  borderRight: `1px solid rgba(0,0,0,0.06)`,
                  backgroundColor: isToday ? `rgba(25, 118, 210, 0.08)` : `rgba(0,0,0,0.02)`,
                  borderBottom: isToday ? `3px solid #1976d2` : `none`,
                }}
              >
                <Box
                  sx={{
                    fontSize: `0.75rem`,
                    color: isToday ? `#1976d2` : `rgba(0,0,0,0.6)`,
                    fontWeight: isToday ? 700 : 500,
                  }}
                >
                  {formatDayHeader(date, true)}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Scrollable calendar body */}
      <Box
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onScrollEnd={handleScrollEnd}
        onTouchEnd={handleScrollEnd}
        onMouseUp={handleScrollEnd}
        sx={{
          flex: 1,
          overflowX: `auto`,
          overflowY: `auto`,
          display: `flex`,
          WebkitOverflowScrolling: `touch`,
          width: `100%`,
          scrollSnapType: `x mandatory`, // Enable snap scrolling
          scrollPaddingLeft: `60px`, // Account for sticky time column
          '&::-webkit-scrollbar': {
            height: `8px`,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: `rgba(0,0,0,0.05)`,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: `rgba(0,0,0,0.2)`,
            borderRadius: `4px`,
          },
        }}
      >
        {/* Time column */}
        <Box
          sx={{
            width: `60px`,
            minWidth: `60px`,
            borderRight: `1px solid rgba(0,0,0,0.08)`,
            position: `sticky`,
            left: 0,
            backgroundColor: `white`,
            zIndex: 5,
          }}
        >
          {Array.from({ length: totalSlots }).map((_, slotIndex) => {
            const hour = minHour + Math.floor(slotIndex / 2);
            const isHourStart = slotIndex % 2 === 0;

            return (
              <Box
                key={`time-${slotIndex}`}
                sx={{
                  height: `${TIME_SLOT_HEIGHT}px`,
                  borderTop: `1px solid ${isHourStart ? `rgba(0,0,0,0.08)` : `rgba(0,0,0,0.04)`}`,
                  display: `flex`,
                  alignItems: `flex-start`,
                  justifyContent: `center`,
                  paddingTop: `4px`,
                  fontSize: `0.75rem`,
                  color: `rgba(0,0,0,0.6)`,
                  fontWeight: 500,
                }}
              >
                {isHourStart ? `${String(hour).padStart(2, `0`)}:00` : ``}
              </Box>
            );
          })}
        </Box>

        {/* Days columns */}
        <Box
          ref={() => {
            // Days container size measured
          }}
          sx={{
            display: `flex`,
            position: `relative`,
            minWidth: `min-content`,
          }}
        >
          {visibleDateRange.map((date, dayIndex) => {
            const dateKey = date.toISOString().slice(0, 10);
            const dayAppointments = appointmentsByDate[dateKey] || [];
            const isToday = isSameDay(date, new Date());

            const dayRef = useRef(null);


            return (
              <Box
                key={`day-${dayIndex}`}
                ref={dayRef}
                sx={{
                  width: `${columnWidth}px`,
                  minWidth: `${columnWidth}px`,
                  maxWidth: `${columnWidth}px`,
                  position: `relative`,
                  borderRight: `1px solid rgba(0,0,0,0.06)`,
                  backgroundColor: isToday ? `rgba(25, 118, 210, 0.02)` : `transparent`,
                  overflow: `hidden`,
                  flexShrink: 0,
                  scrollSnapAlign: `start`, // Enable snap to column
                }}
              >
                {/* Time slots grid */}
                {Array.from({ length: totalSlots }).map((_, slotIndex) => {
                  const isHourStart = slotIndex % 2 === 0;
                  return (
                    <Box
                      key={`slot-${slotIndex}`}
                      sx={{
                        height: `${TIME_SLOT_HEIGHT}px`,
                        borderTop: `1px solid ${isHourStart ? `rgba(0,0,0,0.08)` : `rgba(0,0,0,0.04)`}`,
                      }}
                    />
                  );
                })}

                {/* Appointments */}
                {dayAppointments.map((appointment) => (
                  <AppointmentBlock
                    key={appointment.id || appointment.googleEventId}
                    appointment={appointment}
                    minHour={minHour}
                    slotHeight={TIME_SLOT_HEIGHT}
                    onClick={(anchorElement) => onEventClick?.(appointment, anchorElement)}
                  />
                ))}

                {/* Current time indicator */}
                {isToday &&
                <CurrentTimeIndicator
                  minHour={minHour}
                  slotHeight={TIME_SLOT_HEIGHT}
                />}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

// Component for rendering an appointment block
function AppointmentBlock({
  appointment, minHour, slotHeight, onClick,
}) {
  const start = new Date(appointment.timeStart);
  const end = new Date(appointment.timeEnd);

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const minHourMinutes = minHour * 60;

  const top = ((startMinutes - minHourMinutes) / 30) * slotHeight;
  const height = ((endMinutes - startMinutes) / 30) * slotHeight;

  const isGoogleEvent = appointment.isGoogleEvent;
  const isCanceled = appointment.status === appointmentStatusEnum.canceled;
  const employeeId = appointment.employee?.id;

  const styles = isGoogleEvent
    ? {
      backgroundColor: `#4285f4`,
      borderColor: `#1a73e8`,
      color: `white`,
      fontStyle: `italic`,
      opacity: 0.85,
    }
    : {
      ...getEmployeeColorStyles(employeeId),
      ...(isCanceled && {
        opacity: 0.7,
        borderColor: `#f44336`,
        color: `#d32f2f`,
      }),
    };

  const handleClick = (event) => {
    if (!isGoogleEvent && onClick) {
      onClick(event.currentTarget);
    }
  };

  return (
    <Box
      onClick={handleClick}
      sx={{
        position: `absolute`,
        top: `${top}px`,
        left: `4px`,
        right: `4px`,
        height: `${Math.max(height - 2, 20)}px`,
        borderRadius: `6px`,
        border: `2px solid`,
        padding: `4px 6px`,
        cursor: isGoogleEvent ? `default` : `pointer`,
        fontSize: `0.75rem`,
        fontWeight: 500,
        overflow: `hidden`,
        display: `flex`,
        flexDirection: `column`,
        boxShadow: `0 1px 3px rgba(0,0,0,0.12)`,
        transition: `box-shadow 0.2s`,
        '&:hover': !isGoogleEvent && {
          boxShadow: `0 2px 8px rgba(0,0,0,0.2)`,
        },
        ...styles,
      }}
    >
      <Box
        sx={{
          fontSize: `0.7rem`,
          opacity: 0.9,
          marginBottom: `2px`,
        }}
      >
        {formatTime(start)} - {formatTime(end)}
      </Box>
      <Box
        sx={{
          fontWeight: 600,
          overflow: `hidden`,
          textOverflow: `ellipsis`,
          whiteSpace: `nowrap`,
        }}
      >
        {isGoogleEvent ? `📅 ` : ``}{appointment.serviceName}
      </Box>
      {isCanceled && (
        <Box
          sx={{
            fontSize: `0.65rem`,
            fontWeight: 700,
            color: `#d32f2f`,
            marginTop: `2px`,
          }}
        >
          CANCELED
        </Box>
      )}
    </Box>
  );
}

// Component for current time indicator
function CurrentTimeIndicator({
  minHour, slotHeight,
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const minHourMinutes = minHour * 60;
  const top = ((currentMinutes - minHourMinutes) / 30) * slotHeight;

  return (
    <Box
      sx={{
        position: `absolute`,
        top: `${top}px`,
        left: 0,
        right: 0,
        height: `2px`,
        backgroundColor: `#ea4335`,
        zIndex: 3,
        '&::before': {
          content: `""`,
          position: `absolute`,
          left: `-4px`,
          top: `-4px`,
          width: `10px`,
          height: `10px`,
          borderRadius: `50%`,
          backgroundColor: `#ea4335`,
        },
      }}
    />
  );
}

// Helper functions
function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function formatDayHeader(date, includeYear = false) {
  const weekday = new Intl.DateTimeFormat(`de-DE`, { weekday: `short` }).format(date)
    .replace(/\.$/, ``);
  const day = String(date.getDate());
  const month = String(date.getMonth() + 1).padStart(2, `0`);
  const year = includeYear ? `.${date.getFullYear()}` : ``;
  return `${weekday} ${day}.${month}${year}`;
}

function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, `0`);
  const minutes = String(date.getMinutes()).padStart(2, `0`);
  return `${hours}:${minutes}`;
}

function getEmployeeColorStyles(employeeId) {
  if (!employeeId && employeeId !== 0) {
    return {
      backgroundColor: `#e0e0e0`,
      borderColor: `#bdbdbd`,
      color: `#2b2b2b`,
    };
  }

  const hue = (Number(employeeId) * 47) % 360;
  return {
    backgroundColor: `hsl(${hue} 70% 70%)`,
    borderColor: `hsl(${hue} 70% 60%)`,
    color: `#2b2b2b`,
  };
}
