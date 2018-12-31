/*
 * Backpack - Skyscanner's Design System
 *
 * Copyright 2018 Skyscanner Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import PropTypes from 'prop-types';
import React from 'react';

import { cssModules } from 'bpk-react-utils';
import { DateUtils, BpkCalendarGridPropTypes } from 'bpk-component-calendar';
import { startOfDay, startOfMonth, isSameMonth } from 'date-fns';
import { VariableSizeList as List } from 'react-window';

import STYLES from './bpk-scrollable-calendar-grid-list.scss';
import BpkScrollableCalendarGrid from './BpkScrollableCalendarGrid';
import getMonthsArray from './utils';

const getClassName = cssModules(STYLES);

const ROW_HEIGHT = 42;
const GRID_HEIGHT_WITHOUT_ROWS = 60;
const COLUMN_COUNT = 7;
// Most calendar grids have 5 rows:
const ESTIMATED_ITEM_SIZE = GRID_HEIGHT_WITHOUT_ROWS + 5 * ROW_HEIGHT;

class BpkScrollableCalendarGridList extends React.Component {
  constructor(props) {
    super(props);

    this.outerDivRef = React.createRef();

    const startDate = startOfDay(startOfMonth(this.props.minDate));
    const endDate = startOfDay(startOfMonth(this.props.maxDate));
    const monthsCount = DateUtils.differenceInCalendarMonths(
      endDate,
      startDate,
    );
    const months = getMonthsArray(startDate, monthsCount);
    // Here we calculate the height of each calendar grid item, so that react-window can efficiently render them
    const monthItemHeights = [];
    for (let i = 0; i < months.length; i += 1) {
      const day = (months[i].getDay() + 7 - 1) % 7;
      const monthLength = DateUtils.daysInMonth(
        months[i].getYear(),
        months[i].getMonth(),
      );
      const calendarGridSpaces = day + monthLength;
      const rowCount = Math.ceil(calendarGridSpaces / COLUMN_COUNT);
      monthItemHeights[i] = GRID_HEIGHT_WITHOUT_ROWS + ROW_HEIGHT * rowCount;
    }

    this.state = {
      months,
      monthItemHeights,
      outerHeight: ESTIMATED_ITEM_SIZE,
    };
  }

  getHtmlElement = () =>
    typeof document !== 'undefined' ? document.querySelector('html') : {};

  rowRenderer = ({ index, style }) => (
    <div style={style}>
      <BpkScrollableCalendarGrid
        onDateClick={this.props.onDateClick}
        {...this.props}
        month={this.state.months[index]}
        focusedDate={this.props.focusedDate}
        preventKeyboardFocus={this.props.preventKeyboardFocus}
        aria-hidden={index !== 1}
        className={getClassName('bpk-scrollable-calendar-grid-list__item')}
      />
    </div>
  );

  componentDidMount = () => {
    this.findHeight();
    const documentIfExists = typeof window !== 'undefined' ? document : null;
    if (documentIfExists) {
      documentIfExists.addEventListener('resize', this.findHeight);
      documentIfExists.addEventListener('orientationchange', this.findHeight);
      documentIfExists.addEventListener('fullscreenchange', this.findHeight);
    }
  };

  getItemSize = index => this.state.monthItemHeights[index];

  findHeight = () => {
    const outerNode = this.outerDivRef.current;
    if (outerNode) {
      const newHeight = outerNode.clientHeight;
      this.setState({ outerHeight: newHeight });
    } else {
      this.setState({ outerHeight: ESTIMATED_ITEM_SIZE });
    }
  };

  calculateOffset = numberOfMonths => {
    // Change initialScrollOffset to be correct value based on itemSizes
    let result = 0;
    for (let i = 0; i < numberOfMonths; i += 1) {
      result += this.getItemSize(i);
    }
    return result;
  };

  render() {
    const result = (
      <div
        className={getClassName(
          'bpk-scrollable-calendar-grid-list',
          this.props.className,
        )}
        ref={this.outerDivRef}
      >
        <List
          extraData={this.props}
          style={
            this.getHtmlElement().dir === 'rtl' ? { direction: 'rtl' } : {}
          }
          width="100%"
          height={this.state.outerHeight}
          estimatedItemSize={ESTIMATED_ITEM_SIZE}
          itemSize={this.getItemSize}
          itemCount={this.state.months.length}
          rowCount={this.state.months.length}
          overscanCount={1}
          initialScrollOffset={this.calculateOffset(
            isSameMonth(this.props.focusedDate, this.props.selectedDate)
              ? DateUtils.differenceInCalendarMonths(
                  this.props.selectedDate,
                  this.props.minDate,
                )
              : DateUtils.differenceInCalendarMonths(
                  this.props.focusedDate,
                  this.props.minDate,
                ),
          )}
        >
          {this.rowRenderer}
        </List>
      </div>
    );
    return result;
  }
}

BpkScrollableCalendarGridList.propTypes = {
  className: PropTypes.string,
  minDate: PropTypes.instanceOf(Date).isRequired,
  maxDate: PropTypes.instanceOf(Date).isRequired,
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  focusedDate: PropTypes.instanceOf(Date),
  ...BpkCalendarGridPropTypes,
};

BpkScrollableCalendarGridList.defaultProps = {
  className: null,
  focusedDate: null,
};

export default BpkScrollableCalendarGridList;
