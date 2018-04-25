/*
  There are maximun three column in a timeslot rule.
  Type 1: date
    2017/02/06
    02/06
    06
    2017/02/06-2017/02/10
    02/06-02/10
    06-10
    2017/12/31-2018/02/06
    12/31-02/06
    31-02
    p.s. The format of start and end should be the same.
  Type 2: week day
    SuMoTuWeThFrSa
    Mo-Fr
    Fr-Tu (FrSaSuMoTu)
    Mo
  Type 3: time
    18:00-20:00
    22:00-2:00
    18:00
    p.s. The format of both start and end should be exactly hh:mm
*/

import _ from 'lodash';

const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getTime(year, month, day, hour, minute) {
  const ret = new Date();
  ret.setYear(year);
  ret.setMonth(month - 1, day);
  ret.setHours(hour, minute, 0, 0);
  return ret;
}

function resolveDateStr(dateStr) {
  const arr = dateStr.split('/');
  const ret = {
    year: undefined,
    month: undefined,
    day: undefined,
  };
  if (arr.length === 1) {
    ret.day = parseInt(arr[0], 10);
  } else if (arr.length === 2) {
    ret.month = parseInt(arr[0], 10);
    ret.day = parseInt(arr[1], 10);
  } else {
    ret.year = parseInt(arr[0], 10);
    ret.month = parseInt(arr[1], 10);
    ret.day = parseInt(arr[2], 10);
  }
  return ret;
}

function resolveTimeStr(timeStr) {
  const arr = timeStr.split(':');
  return {
    hour: parseInt(arr[0], 10),
    minute: parseInt(arr[1], 10),
  };
}

function consoleRuleObj(rule) {
  if (!(rule instanceof Array)) rule = [rule];
  _.each(rule, (rule) => {
    let str = '';
    if (rule.date.start) {
      if (str) str += ' ';
      const { start, end } = rule.date;
      if (start.year) str += `${start.year}/${start.month}/${start.day}-${end.year}/${end.month}/${end.day}`;
      else if (start.month) str += `${start.month}/${start.day}-${end.month}/${end.day}`;
      else str += `${start.day}-${end.day}`;
    }
    if (rule.days.size) {
      if (str) str += ' ';
      rule.days.forEach((day) => {
        str += dayNames[day];
      });
    }
    if (rule.time.start) {
      if (str) str += ' ';
      const { start, end } = rule.time;
      str += `${start.hour < 10 ? '0' : ''}${start.hour}:${start.minute < 10 ? '0' : ''}${start.minute}-${end.hour < 10 ? '0' : ''}${end.hour}:${end.minute < 10 ? '0' : ''}${end.minute}`;
    }
    if (rule.wNextDay) str += ' nextDay';
    console.log(str);
  });
}

function regulateTimeslotRule(timeslotRule) {
  let dateStr = '';
  let dayStr = '';
  let timeStr = '';
  _.each(timeslotRule.split(' '), (col) => {
    if (col.indexOf(':') !== -1) {
      timeStr = col;
      return;
    }
    let wDay = false;
    _.each(dayNames, (dayName) => {
      if (col.indexOf(dayName) !== -1) {
        wDay = true;
        dayStr = col;
        return false;
      }
    });
    if (wDay) return;
    dateStr = col;
  });

  const rule = {
    date: {
      start: undefined,
      end: undefined,
    },
    days: new Set(),
    time: {
      start: undefined,
      end: undefined,
    },
  };
  if (dateStr) { // Deal with date
    const dateArr = dateStr.split('-');
    rule.date.start = resolveDateStr(dateArr[0]);
    rule.date.end = dateArr[1] ? resolveDateStr(dateArr[1]) : _.cloneDeep(rule.date.start);
  }
  if (dayStr) { // Deal with week day
    if (dayStr.indexOf('-') !== -1) { // A range
      const start = dayStr.slice(0, 2);
      const end = dayStr.slice(3, 5);
      for (let i = dayNames.indexOf(start); ;i = (i + 1) % 7) {
        rule.days.add(i);
        if (dayNames[i] === end) break;
      }
    } else { // A set
      _.each(dayNames, (dayName, index) => {
        if (dayStr.indexOf(dayName) !== -1) rule.days.add(index);
      });
    }
  }
  if (timeStr) { // Deal with time
    const timeArr = timeStr.split('-');
    rule.time.start = resolveTimeStr(timeArr[0]);
    rule.time.end = timeArr[1] ? resolveTimeStr(timeArr[1]) : _.cloneDeep(rule.time.start);
  }

  // Break down cross-session time
  const rules = [rule];
  for (let l = 0, r = 0; l <= r; l += 1) {
    const rule = rules[l];
    if (typeof rule.time.start !== 'undefined') {
      const { start, end } = rule.time;
      if (end.hour < start.hour || (end.hour === start.hour && end.minute < start.minute)) {
        const ruleN = _.cloneDeep(rule); // The second half of timeslot
        rule.time.end.hour = 23;
        rule.time.end.minute = 59;
        ruleN.time.start.hour = 0;
        ruleN.time.start.minute = 0;
        ruleN.days = new Set();
        rule.days.forEach((day) => {
          ruleN.days.add((day + 1) % 7); // Week day can be directly plus one.
        });
        ruleN.wNextDay = true; // Date is complicated, so should be dealed later.
        r += 1;
        rules[r] = ruleN;
      }
    }
    if (typeof rule.date.start !== 'undefined' && !rule.date.start.year) {
      const { start, end } = rule.date;
      if (typeof start.month !== 'undefined') {
        if (end.month < start.month || (start.month === end.month && end.day < start.day)) {
          const ruleN = _.cloneDeep(rule);
          rule.date.end.month = 12;
          rule.date.end.day = 31;
          ruleN.date.start.month = 1;
          ruleN.date.start.day = 1;
          r += 1;
          rules[r] = ruleN;
        }
      } else if (start.day < end.day) {
        const ruleN = _.cloneDeep(rule);
        rule.date.end.day = 31;
        ruleN.date.start.day = 1;
        r += 1;
        rules[r] = ruleN;
      }
    }
  }

  return rules;
}

function getSingleCoincidentTimeslot(rule, ruleC) {
  const time = {
    start: ruleC.time.start.hour * 60 + ruleC.time.start.minute,
    end: ruleC.time.end.hour * 60 + ruleC.time.end.minute,
  };
  if (rule.time.start) {
    const timeS1 = rule.time.start.hour * 60 + rule.time.start.minute;
    const timeE1 = rule.time.end.hour * 60 + rule.time.end.minute;
    if (timeS1 > time.end || timeE1 < time.start) {
      time.start = undefined;
      time.end = undefined;
    } else {
      if (timeS1 > time.start) time.start = timeS1;
      if (timeE1 < time.end) time.end = timeE1;
    }
  }
  if (typeof time.start === 'undefined') return; // No coincident time.
  const day = ruleC.day;
  if (rule.days.size && !rule.days.has(day)) return;
  if (rule.date.start) {
    const dateS = {
      year: rule.date.start.year || ruleC.date.year,
      month: rule.date.start.month || ruleC.date.month,
      day: rule.date.start.day,
    };
    const dateE = {
      year: rule.date.end.year || ruleC.date.year,
      month: rule.date.end.month || ruleC.date.month,
      day: rule.date.end.day,
    };
    const dateSStr = `${dateS.year}${dateS.month < 10 ? '0' : ''}${dateS.month}${dateS.day < 10 ? '0' : ''}${dateS.day}`;
    const dateEStr = `${dateE.year}${dateE.month < 10 ? '0' : ''}${dateE.month}${dateE.day < 10 ? '0' : ''}${dateE.day}`;
    const timeA = new Date(getTime(ruleC.date.year, ruleC.date.month, ruleC.date.day, 0, 0).getTime() - (rule.wNextDay ? 24 * 60 * 60000 : 0));
    const date = {
      year: timeA.getFullYear(),
      month: timeA.getMonth() + 1,
      day: timeA.getDate(),
    };
    const dateStr = `${date.year}${date.month < 10 ? '0' : ''}${date.month}${date.day < 10 ? '0' : ''}${date.day}`;
    if (dateSStr.localeCompare(dateStr) > 0 || dateStr.localeCompare(dateEStr)) return;
  }
  return {
    start: getTime(ruleC.date.year, ruleC.date.month, ruleC.date.day, Math.floor(time.start / 60), time.start % 60),
    end: getTime(ruleC.date.year, ruleC.date.month, ruleC.date.day, Math.floor(time.end / 60), time.end % 60),
  };
}

function getTimeslotsByRule(campaignRule) {
  const rules = regulateTimeslotRule(campaignRule.timeslot);
  const time0 = new Date(new Date().getTime() + (new Date().getTimezoneOffset() + 480) * 60000 + campaignRule.deadlineAdvanceMinutes * 60000);
  const time1 = new Date(time0.getTime() + campaignRule.renewRangeMinutes * 60000);
  const timeslots = [];
  let timeS = time0;
  for (;;) {
    let wOver = false;
    const ruleC = {
      date: {
        year: timeS.getFullYear(),
        month: timeS.getMonth() + 1,
        day: timeS.getDate(),
      },
      day: timeS.getDay(),
      time: {
        start: {
          hour: timeS.getHours(),
          minute: timeS.getMinutes(),
        },
        end: {
          hour: 23,
          minute: 59,
        },
      },
    };

    const timeE = getTime(ruleC.date.year, ruleC.date.month, ruleC.date.day, ruleC.time.end.hour, ruleC.time.end.minute);
    if (timeE.getTime() + 60000 > time1.getTime()) {
      wOver = true;
      ruleC.time.end = {
        hour: time1.getHours(),
        minute: time1.getMinutes(),
      };
    }

    _.each(rules, (rule) => {
      const timeslot = getSingleCoincidentTimeslot(rule, ruleC);
      if (!timeslot) return;
      const timeB = rule.time.start ? rule.time.start.hour * 60 + rule.time.start.minute : 0;
      const timeD = (timeslot.start.getHours() * 60 + timeslot.start.getMinutes() - timeB) % (campaignRule.stepMinutes || 1);
      for (let time = timeslot.start - timeD * 60000; time <= timeslot.end; time += (campaignRule.stepMinutes || 1) * 60000) {
        const timeJSON = JSON.stringify(new Date(time - (new Date().getTimezoneOffset() + 480) * 60000));
        timeslots.push(timeJSON.slice(1, timeJSON.length - 1));
      }
    });

    if (wOver) break;
    timeS = new Date(timeE.getTime() + 60000);
  }

  return timeslots;
}

export default function getTimeslots(campaignRules) {
  const timeslots = {};
  _.each(campaignRules, (campaignRule) => {
    if (!campaignRule.avail) return;
    if (campaignRule.type !== '+') return;
    const arr = getTimeslotsByRule(campaignRule);
    _.each(arr, (timeslot) => {
      if (!timeslots[timeslot] || timeslots[timeslot].priority < campaignRule.priority) {
        timeslots[timeslot] = {
          priority: campaignRule.priority,
          deliveryTime: new Date(timeslot),
          deadline: new Date(new Date(timeslot) - campaignRule.deadlineAdvanceMinutes * 60000),
          percentOff: campaignRule.percentOff,
          locations: _.cloneDeep(campaignRule.locations),
        };
      }
    });
  });
  _.each(campaignRules, (campaignRule) => {
    if (!campaignRule.avail) return;
    if (campaignRule.type !== '-') return;
    const rules = regulateTimeslotRule(campaignRule.timeslot);
    _.each(rules, (rule) => {
      _.each(timeslots, (timeslot, index) => {
        const time = new Date(timeslot.time.getTime() + (new Date().getTimezoneOffset() + 480) * 60000);
        if (getSingleCoincidentTimeslot(rule, {
          date: {
            year: time.getFullYear(),
            month: time.getMonth() + 1,
            day: time.getDate(),
          },
          day: time.getDay(),
          time: {
            start: {
              hour: time.getHours(),
              minute: time.getMinutes(),
            },
            end: {
              hour: time.getHours(),
              minute: time.getMinutes(),
            },
          },
        })) {
          delete timeslots[index];
        }
      });
    });
  });
  return timeslots;
}
