type Digit = `0` | `1` | `2` | `3` | `4` | `5` | `6` | `7` | `8` | `9`;
type Hours = `0${Digit}` | `1${Digit}` | `2${`0` | `1` | `2` | `3`}`;
type MinutesSeconds = `0${Digit}` | `1${Digit}` | `2${Digit}` | `3${Digit}` | `4${Digit}` | `5${Digit}`;

type Time_HH_MM_SS_Type = `${Hours}:${MinutesSeconds}:${MinutesSeconds}`;

type Year = `20${Digit}${Digit}` | `19${Digit}${Digit}`;
type Month = `0${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}` | `1${0 | 1 | 2}`;
type Day = `0${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}` | `${1 | 2}${Digit}` | `3${0 | 1}`;

type Date_ISO_Type = `${Year}-${Month}-${Day}`;

export {
  Time_HH_MM_SS_Type,
  Date_ISO_Type,
}