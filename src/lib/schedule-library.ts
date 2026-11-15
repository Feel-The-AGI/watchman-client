import type { CycleBlock } from './rotation'

export interface Faq {
  q: string
  a: string
}

export interface ScheduleGuide {
  slug: string
  /** Page heading, e.g. "4 on 4 off schedule". */
  name: string
  /** Short label for preset buttons. */
  short: string
  /** One line for cards and the meta description. */
  summary: string
  pattern: CycleBlock[]
  /** Usual shift length in hours, used for the weekly average. */
  shiftHours: number
  /** Plain-English explanation, one paragraph per entry. */
  howItWorks: string[]
  whoUses: string[]
  pros: string[]
  cons: string[]
  faqs: Faq[]
}

const D = (duration: number): CycleBlock => ({ label: 'work_day', duration })
const N = (duration: number): CycleBlock => ({ label: 'work_night', duration })
const O = (duration: number): CycleBlock => ({ label: 'off', duration })

export const SCHEDULES: ScheduleGuide[] = [
  {
    slug: '4-on-4-off',
    name: '4 on 4 off schedule',
    short: '4 on 4 off',
    summary: 'Four 12-hour shifts, then four days off, repeating every 8 days.',
    pattern: [D(4), O(4)],
    shiftHours: 12,
    howItWorks: [
      'You work four shifts in a row, usually 12 hours each, then have four days off. The cycle is 8 days long, so your working days move through the week: if you start on a Monday this cycle, you start on a Tuesday next cycle.',
      'Two crews can cover every day of the year with this pattern: while one crew is on its four shifts, the other is off. A plant that runs around the clock needs four crews, two on days and two on nights.',
    ],
    whoUses: ['Manufacturing and process plants', 'Security and control rooms', 'Warehouses and distribution centres', 'Some hospital and lab departments'],
    pros: ['Four full days off every cycle', 'Easy to remember', 'Fewer commutes than a five-day week'],
    cons: ['Four 12-hour shifts in a row are tiring', 'Days off rarely line up with weekends', 'Hard to plan without a calendar because the start day moves'],
    faqs: [
      { q: 'How many hours a week is 4 on 4 off?', a: 'With 12-hour shifts it averages 42 hours a week: 48 hours of work in every 8 days. Some weeks you work more and some less, because the cycle does not line up with a 7-day week.' },
      { q: 'How many weekends do I get off on a 4 on 4 off rotation?', a: 'The 8-day cycle drifts one day each week, so your four days off cover a full Saturday and Sunday about three weekends in every eight, and part of a weekend more often. The calculator on this page shows exactly which ones.' },
      { q: 'Is 4 on 4 off the same as 4 days, 4 nights?', a: 'No. Plain 4 on 4 off keeps you on the same shift. A rotating version adds four nights after the days off, which makes a 16-day cycle. See the 4 on 4 off days and nights page.' },
      { q: 'How do I work out which days I am working?', a: 'Pick one date you know you are on your first shift, enter it as cycle day 1, and the calculator counts forward in 8-day steps.' },
    ],
  },
  {
    slug: '4-on-4-off-days-and-nights',
    name: '4 on 4 off days and nights',
    short: '4D 4O 4N 4O',
    summary: 'Four day shifts, four off, four night shifts, four off: a 16-day rotating cycle.',
    pattern: [D(4), O(4), N(4), O(4)],
    shiftHours: 12,
    howItWorks: [
      'You work four 12-hour day shifts, have four days off, then work four 12-hour night shifts and have four more days off. The full cycle is 16 days.',
      'Because days and nights alternate, four crews together cover 24 hours a day, every day.',
    ],
    whoUses: ['24/7 manufacturing', 'Oil refineries and chemical plants', 'Power generation', 'Utilities control rooms'],
    pros: ['Four days off between every block', 'Equal share of days and nights for every crew', 'Same 42-hour average as fixed 4 on 4 off'],
    cons: ['Switching between days and nights disrupts sleep', 'The first night after days off is hard', 'Planning a month ahead needs a calendar'],
    faqs: [
      { q: 'How many hours a week is this rotation?', a: 'With 12-hour shifts it averages 42 hours a week: 96 hours of work in every 16 days.' },
      { q: 'How long is the cycle?', a: '16 days: 4 days, 4 off, 4 nights, 4 off. The same weekday comes round at the same point of the cycle every 112 days.' },
      { q: 'How do I recover from four nights?', a: 'Most people sleep for a few hours the morning after the last night, then try to go to bed at a normal time that evening. The four days off after nights give you room to reset before the next day block.' },
      { q: 'Can Watchman handle a crew change in the middle of a rotation?', a: 'Yes. Tell the Watchman agent your new rotation and the date it starts. Your calendar changes from that date forward and the days you have already worked stay as they were.' },
    ],
  },
  {
    slug: '2-2-4',
    name: '2-2-4 shift pattern',
    short: '2-2-4',
    summary: 'Two day shifts, two night shifts, then four days off: an 8-day cycle.',
    pattern: [D(2), N(2), O(4)],
    shiftHours: 12,
    howItWorks: [
      'You work two 12-hour day shifts, then two 12-hour night shifts, then have four days off. The cycle is 8 days.',
      'It is a version of 4 on 4 off that splits each working block into days and nights, so nobody works more than two nights in a row.',
    ],
    whoUses: ['24/7 manufacturing in the UK and Europe', 'Emergency control rooms', 'Food production', 'Security'],
    pros: ['Never more than two nights in a row', 'Four days off every 8 days', 'Quick to learn'],
    cons: ['The day you finish nights is the first day off, and it is often lost to sleep', 'Frequent switching between days and nights', 'Days off move through the week'],
    faqs: [
      { q: 'How many hours a week is 2-2-4?', a: 'With 12-hour shifts it averages 42 hours a week: 48 hours of work every 8 days.' },
      { q: 'How many crews does 2-2-4 need for 24/7 cover?', a: 'Four crews. At any time one is on days, one is on nights and two are off.' },
      { q: 'Is 2-2-4 better than 4 on 4 off?', a: 'It depends on how you cope with nights. 2-2-4 limits you to two nights in a row; fixed 4 on 4 off keeps you on one shift and avoids switching.' },
      { q: 'How do I set up a 2-2-4 calendar?', a: 'Enter the date of your first day shift as cycle day 1 in the calculator, then save it to Watchman to keep it on your phone.' },
    ],
  },
  {
    slug: 'dupont',
    name: 'DuPont schedule',
    short: 'DuPont',
    summary: 'A 28-day, four-crew 12-hour rotation with a 7-day break once a cycle.',
    pattern: [N(4), O(3), D(3), O(1), N(3), O(3), D(4), O(7)],
    shiftHours: 12,
    howItWorks: [
      'The DuPont schedule runs in 28-day cycles. A common sequence is 4 nights, 3 off, 3 days, 1 off, 3 nights, 3 off, 4 days, then 7 days off.',
      'Four crews follow the same sequence, each starting a week apart, so 12-hour day and night shifts are covered every day. Some workplaces start the cycle with the day shifts instead of the nights; the blocks are the same.',
    ],
    whoUses: ['Chemical and petrochemical plants', 'Paper mills', 'Power stations', 'Some police and fire departments'],
    pros: ['A full week off every 28 days', 'Predictable: the same sequence every 4 weeks', 'Equal days and nights for everyone'],
    cons: ['The 1-day break between days and nights is short', 'Six 12-hour shifts in the second week', 'The middle of the cycle is demanding'],
    faqs: [
      { q: 'How many hours a week is the DuPont schedule?', a: 'It averages 42 hours a week with 12-hour shifts: 14 shifts, or 168 hours, in 28 days.' },
      { q: 'When is the 7-day break?', a: 'At the end of each 28-day cycle, after the second block of day shifts.' },
      { q: 'Does the DuPont schedule always start with nights?', a: 'No. Many sites start with the four day shifts. The calculator lets you pick which day of the cycle a known date is, so either start works.' },
      { q: 'Why is it called DuPont?', a: 'It is named after the chemical company that used it at its plants.' },
    ],
  },
  {
    slug: 'panama-2-2-3',
    name: 'Panama (2-2-3) schedule',
    short: 'Panama 2-2-3',
    summary: 'Two on, two off, three on, two off, two on, three off: a 14-day cycle with every other weekend off.',
    pattern: [D(2), O(2), D(3), O(2), D(2), O(3)],
    shiftHours: 12,
    howItWorks: [
      'You work 2 shifts, have 2 off, work 3, have 2 off, work 2, then have 3 off. That is 7 twelve-hour shifts in 14 days.',
      'Started on a Monday, the 3-shift block and the 3 days off both include a weekend, so you work every other weekend and have the others off, Friday to Sunday. Four crews cover 24/7, two on days and two on nights.',
    ],
    whoUses: ['Police departments', 'Hospitals', 'Manufacturing', 'Corrections'],
    pros: ['Every other weekend off, Friday to Sunday', 'Never more than 3 shifts in a row', 'Repeats every two weeks, so it is easy to learn'],
    cons: ['Short 2-day breaks between blocks', 'Long days on 12-hour shifts', 'Hours vary from one week to the next'],
    faqs: [
      { q: 'How many hours a week is a 2-2-3 schedule?', a: 'It averages 42 hours a week: 84 hours every two weeks with 12-hour shifts. How that is paid depends on your employer and local overtime rules.' },
      { q: 'Is Panama the same as Pitman?', a: 'Many workplaces use the names interchangeably for the fixed 2-2-3 pattern. Others use Pitman for a 28-day version that switches between days and nights every two weeks; see the Pitman schedule page.' },
      { q: 'Which weekends do I get off on 2-2-3?', a: 'Every other weekend, if your cycle starts on a Monday. The calculator shows the exact weekends for your start date.' },
      { q: 'How many crews do I need for 24/7 coverage?', a: 'Four: two crews alternate on days and two alternate on nights.' },
    ],
  },
  {
    slug: 'pitman',
    name: 'Pitman schedule (rotating 2-2-3)',
    short: 'Pitman',
    summary: 'The 2-2-3 pattern on days for two weeks, then on nights for two weeks: a 28-day cycle.',
    pattern: [D(2), O(2), D(3), O(2), D(2), O(3), N(2), O(2), N(3), O(2), N(2), O(3)],
    shiftHours: 12,
    howItWorks: [
      'For the first 14 days you work the 2-2-3 pattern on day shifts: 2 on, 2 off, 3 on, 2 off, 2 on, 3 off. For the next 14 days you work the same pattern on nights. The full cycle is 28 days.',
      'Some workplaces call the fixed 2-2-3 pattern Pitman as well. If you never switch to nights, use the Panama 2-2-3 page instead. The 12-hour "Continental" rotation used in many plants is this same rotating 2-2-3 pattern.',
    ],
    whoUses: ['Police departments', 'Manufacturing', 'Utilities', 'Healthcare'],
    pros: ['Every other weekend off', 'Two full weeks on the same shift before switching', 'Fair split of days and nights'],
    cons: ['The switch from days to nights every two weeks takes adjustment', 'Short breaks between blocks', '12-hour days'],
    faqs: [
      { q: 'How many hours a week is the Pitman schedule?', a: 'It averages 42 hours a week with 12-hour shifts: 14 shifts in 28 days.' },
      { q: 'What is the difference between Pitman and Panama?', a: 'The working pattern is the same 2-2-3. In the rotating Pitman version you spend two weeks on days, then two weeks on nights. In a fixed Panama schedule you stay on one shift.' },
      { q: 'Is the Continental schedule the same as Pitman?', a: 'The 12-hour Continental rotation is a rotating 2-2-3, so yes in most workplaces. An older 8-hour Continental rotates mornings, afternoons and nights, which is a different pattern.' },
      { q: 'How do I find my next night shift?', a: 'Enter one date you know and its cycle day, and the calculator shows your next night shift and the next three months.' },
    ],
  },
  {
    slug: '5-5-5',
    name: '5-5-5 schedule (5 days, 5 nights, 5 off)',
    short: '5-5-5',
    summary: 'Five day shifts, five night shifts, five days off: a 15-day cycle.',
    pattern: [D(5), N(5), O(5)],
    shiftHours: 12,
    howItWorks: [
      'You work five day shifts, then five night shifts, then have five days off. The cycle is 15 days.',
      'Three crews following the pattern five days apart cover days and nights continuously.',
    ],
    whoUses: ['Mining', 'Oil and gas operations', 'Some manufacturing plants', 'Remote sites'],
    pros: ['Five days off in a row every cycle', 'Only one switch from days to nights per cycle', 'Three crews are enough for 24/7 cover'],
    cons: ['Ten 12-hour shifts in a row is a lot', 'Heavy weekly hours', 'The day after the last night is usually lost to sleep'],
    faqs: [
      { q: 'How many hours a week is a 5-5-5 roster?', a: 'With 12-hour shifts it averages 56 hours a week: 120 hours of work every 15 days.' },
      { q: 'How many crews does 5-5-5 need?', a: 'Three crews, each starting five days after the last.' },
      { q: 'Why do people choose 5-5-5?', a: 'The five days off are long enough to travel or rest properly, and you only switch from days to nights once per cycle.' },
      { q: 'Can I add leave to a 5-5-5 calendar?', a: 'Yes. In Watchman you can book leave on any days and the rest of the rotation stays as it is.' },
    ],
  },
  {
    slug: '7-on-7-off',
    name: '7 on 7 off schedule',
    short: '7 on 7 off',
    summary: 'Seven shifts in a row, then seven days off: a 14-day cycle.',
    pattern: [D(7), O(7)],
    shiftHours: 12,
    howItWorks: [
      'You work seven shifts in a row, usually 12 hours each, then have a full week off. The cycle repeats every 14 days, so your week on always starts on the same weekday.',
      'Some workplaces alternate a week of days with a week of nights instead; that is a different, 28-day rotation.',
    ],
    whoUses: ['Hospital nurses and doctors', 'Remote and offshore work', 'Security', 'Pharmacies'],
    pros: ['A full week off every two weeks', 'Same weekday every time, so it is easy to plan', 'Fewer commutes'],
    cons: ['Seven 12-hour shifts in a row is exhausting', 'Little time for anything else during the working week', 'Childcare is hard to arrange for a full week'],
    faqs: [
      { q: 'How many hours a week is 7 on 7 off?', a: 'With 12-hour shifts it averages 42 hours a week: 84 hours every two weeks.' },
      { q: 'Does 7 on 7 off always start on the same day?', a: 'Yes. The cycle is exactly two weeks long, so your first shift is always on the same weekday.' },
      { q: 'How many weekends do I work?', a: 'Every other weekend: every week on includes one.' },
      { q: 'Is 7 on 7 off good for nurses?', a: 'Many nurses like the full week off. It works best if you can rest properly during the week on.' },
    ],
  },
  {
    slug: '3-on-3-off',
    name: '3 on 3 off schedule',
    short: '3 on 3 off',
    summary: 'Three 12-hour shifts, then three days off: a 6-day cycle.',
    pattern: [D(3), O(3)],
    shiftHours: 12,
    howItWorks: [
      'You work three shifts in a row, usually 12 hours, then have three days off. The cycle is 6 days, so the start day moves one day earlier in the week each cycle.',
      'Two crews cover every day; four crews cover days and nights.',
    ],
    whoUses: ['Healthcare', 'Security', 'Call centres', 'Manufacturing'],
    pros: ['Only three long shifts in a row', 'Three days off every cycle', 'Same 42-hour average as 4 on 4 off'],
    cons: ['Days off move through the week', 'Weekends off come round irregularly', 'More commutes than longer blocks'],
    faqs: [
      { q: 'How many hours a week is 3 on 3 off?', a: 'With 12-hour shifts it averages 42 hours a week: 36 hours of work every 6 days.' },
      { q: 'How often do I get a weekend off?', a: 'The 6-day cycle moves one day per week, so the pattern of weekends off repeats every six weeks. The calculator shows the exact dates.' },
      { q: 'Is 3 on 3 off easier than 4 on 4 off?', a: 'The shifts are the same length and the average hours are the same; the blocks are shorter, so it is less tiring but you commute more often.' },
      { q: 'How do I keep track of a 3 on 3 off rotation?', a: 'Enter one known shift date in the calculator, or save the rotation to Watchman to keep a full calendar.' },
    ],
  },
  {
    slug: '24-48',
    name: '24/48 firefighter schedule',
    short: '24/48',
    summary: 'One 24-hour shift, then 48 hours off: a 3-day cycle.',
    pattern: [D(1), O(2)],
    shiftHours: 24,
    howItWorks: [
      'You work a 24-hour shift, then have the next two days off. The cycle repeats every 3 days, so three platoons (often called A, B and C shift) cover the station around the clock.',
      'In the calculator the 24-hour shift shows as a work day.',
    ],
    whoUses: ['Fire departments', 'EMS and ambulance services', 'Some rural hospitals'],
    pros: ['Only about 10 shifts a month', 'Two full days off after every shift', 'Fewer commutes'],
    cons: ['56 hours a week on average', 'Sleep on shift depends on call volume', 'Hard to keep up routines that need a fixed weekday'],
    faqs: [
      { q: 'How many hours a week is a 24/48 schedule?', a: 'It averages 56 hours a week: one 24-hour shift every three days.' },
      { q: 'How many shifts a month is 24 on 48 off?', a: 'About 10, depending on the month: 30 days divided by a 3-day cycle.' },
      { q: 'What is the difference between 24/48 and a Kelly schedule?', a: 'A Kelly schedule adds extra days off to the 24/48 pattern. A common version is on, off, on, off, on, then four days off: a 9-day cycle.' },
      { q: 'Which platoon am I on, and when is my next shift?', a: 'Enter the date of one of your shifts as cycle day 1 and the calculator marks every shift after it.' },
    ],
  },
  {
    slug: 'kelly-schedule',
    name: 'Kelly schedule',
    short: 'Kelly',
    summary: 'On, off, on, off, on, then four days off, with 24-hour shifts: a 9-day cycle.',
    pattern: [D(1), O(1), D(1), O(1), D(1), O(4)],
    shiftHours: 24,
    howItWorks: [
      'A common Kelly schedule is one 24-hour shift, one day off, another shift, another day off, a third shift, then four days off. The cycle is 9 days, and three platoons cover the station.',
      'Departments vary: some add a "Kelly day" to a 24/48 rotation every few weeks instead. If yours is different, enter your own blocks in the calculator.',
    ],
    whoUses: ['Fire departments', 'EMS services'],
    pros: ['Four days off in a row every cycle', 'No more than one 24-hour shift in a row', 'Three platoons cover 24/7'],
    cons: ['56 hours a week on average', 'Days off between shifts are short', 'The cycle does not line up with weeks, so weekends off vary'],
    faqs: [
      { q: 'How many hours a week is a Kelly schedule?', a: 'This 9-day version averages 56 hours a week: three 24-hour shifts every 9 days.' },
      { q: 'What is a Kelly day?', a: 'An extra scheduled day off added to a firefighter rotation to bring average hours down. Departments add it in different ways.' },
      { q: 'Is the Kelly schedule the same everywhere?', a: 'No. The on-off-on-off-on-four-off version is common, but check your department roster and enter its exact blocks in the calculator if it differs.' },
      { q: 'How do I see my Kelly days for the year?', a: 'Enter one known shift date in the calculator to see the next three months, or save the rotation to Watchman for a full calendar.' },
    ],
  },
  {
    slug: 'fifo-14-14',
    name: 'FIFO 14/14 roster',
    short: '14/14',
    summary: 'Fourteen days on site, fourteen days at home: a 28-day cycle.',
    pattern: [D(14), O(14)],
    shiftHours: 12,
    howItWorks: [
      'You work 14 days in a row on site, usually 12-hour shifts, then fly home for 14 days. Travel days are often part of the days on or off depending on your company.',
      'Some sites split the 14 days into 7 days and 7 nights. If yours does, use the custom blocks in the calculator.',
    ],
    whoUses: ['Mining in Australia, Africa and Canada', 'Offshore oil and gas', 'Remote construction'],
    pros: ['Two full weeks at home every month', 'Equal time on and off', 'Same weekday every cycle'],
    cons: ['Two weeks away from home', '14 shifts in a row', 'Missed birthdays and events fall where they fall'],
    faqs: [
      { q: 'How many hours a week is a 14/14 roster?', a: 'With 12-hour shifts it averages 42 hours a week across the whole cycle, but 84 hours in each week on site.' },
      { q: 'Does 14/14 always fall on the same days?', a: 'Yes. The cycle is exactly four weeks, so you always fly in on the same weekday.' },
      { q: 'Can I see which family events I will miss?', a: 'Enter your next fly-in date as cycle day 1 and check any date with the lookup on this page, or save the roster to Watchman and add events to it.' },
      { q: 'What if my swing changes?', a: 'Tell the Watchman agent the new roster and the date it starts. Past swings stay as they were and the calendar changes from that date on.' },
    ],
  },
  {
    slug: 'fifo-8-6',
    name: 'FIFO 8/6 roster',
    short: '8/6',
    summary: 'Eight days on site, six days at home: a 14-day cycle.',
    pattern: [D(8), O(6)],
    shiftHours: 12,
    howItWorks: [
      'You work 8 days in a row on site, then have 6 days at home. The cycle is 14 days, so your fly-in day is the same weekday every fortnight.',
      'Travel is usually on the first and last day of the swing.',
    ],
    whoUses: ['Mining', 'Remote construction', 'Oil and gas'],
    pros: ['Home every fortnight', 'Shorter swings than 14/14', 'Same weekday every cycle'],
    cons: ['More flights than longer rosters', 'Six days at home goes quickly after travel', '48-hour average week'],
    faqs: [
      { q: 'How many hours a week is an 8/6 roster?', a: 'With 12-hour shifts it averages 48 hours a week across the cycle: 96 hours every 14 days.' },
      { q: 'Is 8/6 better than 14/14?', a: 'You are home more often but for shorter stretches, and you travel twice as often.' },
      { q: 'Which weekday do I fly in?', a: 'The same one every fortnight, because the cycle is exactly 14 days.' },
      { q: 'How do I share my roster with family?', a: 'Save it to Watchman and create a share link. Family can see your days on and off without an account.' },
    ],
  },
  {
    slug: 'fifo-2-weeks-on-1-off',
    name: 'FIFO 2 weeks on 1 week off (14/7)',
    short: '14/7',
    summary: 'Fourteen days on site, seven days at home: a 21-day cycle.',
    pattern: [D(14), O(7)],
    shiftHours: 12,
    howItWorks: [
      'You work 14 days on site, then have 7 days at home. The cycle is 21 days, so it lines up with the week: your fly-in day is the same weekday every three weeks.',
    ],
    whoUses: ['Mining', 'Oil and gas', 'Remote camps'],
    pros: ['Two-thirds of the year on site means high earnings', 'Predictable three-week cycle', 'A full week at home'],
    cons: ['56-hour average week', 'Only one week at home in three', 'Hard on family life'],
    faqs: [
      { q: 'How many hours a week is 2 weeks on 1 week off?', a: 'With 12-hour shifts it averages 56 hours a week across the cycle: 168 hours every 21 days.' },
      { q: 'How many days a year am I on site?', a: 'About 243 days: two-thirds of the year.' },
      { q: 'Does it start on the same weekday every time?', a: 'Yes. 21 days is exactly three weeks.' },
      { q: 'Can I plan leave around my swing?', a: 'Yes. Save the roster to Watchman and book leave on any dates; the rest of the roster stays as it is.' },
    ],
  },
]

export function scheduleBySlug(slug: string): ScheduleGuide | undefined {
  return SCHEDULES.find((schedule) => schedule.slug === slug)
}

export interface AudienceGuide {
  slug: string
  title: string
  /** Who the page is for, e.g. "nurses". */
  audience: string
  summary: string
  pains: string[]
  scheduleSlugs: string[]
}

export const AUDIENCES: AudienceGuide[] = [
  {
    slug: 'nurses',
    title: 'Shift calendar for nurses',
    audience: 'nurses',
    summary: 'Keep your rota, your nights, your leave and your life in one calendar.',
    pains: [
      'Rotas arrive as a PDF or a spreadsheet and change after they are published.',
      'Swapping a shift means redoing your own calendar by hand.',
      'Planning annual leave around nights and weekends takes guesswork.',
      'Studying, childcare and appointments have to fit around a week that is never the same twice.',
    ],
    scheduleSlugs: ['7-on-7-off', '3-on-3-off', 'panama-2-2-3', '4-on-4-off'],
  },
  {
    slug: 'firefighters',
    title: 'Shift calendar for firefighters',
    audience: 'firefighters',
    summary: 'See every 24-hour shift, Kelly day and day off for the year at a glance.',
    pains: [
      'A 3-day or 9-day cycle never lines up with the week, so family plans need counting on fingers.',
      'Trades and overtime shifts change the picture month to month.',
      'Partners and family want to know when you are on without asking every time.',
    ],
    scheduleSlugs: ['24-48', 'kelly-schedule', 'dupont'],
  },
  {
    slug: 'fifo-workers',
    title: 'Roster calendar for FIFO workers',
    audience: 'FIFO workers in mining and oil and gas',
    summary: 'Know which birthdays, weekends and school holidays fall on your swing before you book anything.',
    pains: [
      'A swing that does not match the week makes it hard to see which family events you will miss.',
      'Roster changes mid-year mean redoing every date after the change.',
      'Family at home need to see when you are away without a spreadsheet.',
    ],
    scheduleSlugs: ['fifo-14-14', 'fifo-8-6', 'fifo-2-weeks-on-1-off', '5-5-5'],
  },
  {
    slug: 'police',
    title: 'Shift calendar for police officers',
    audience: 'police officers',
    summary: 'Keep a rotating roster, court dates, overtime and leave in one place.',
    pains: [
      'Rotating 2-2-3 and DuPont rosters make it hard to see weekends off months ahead.',
      'Court dates and overtime land on days off.',
      'Recording what happened on a shift, and when, matters later.',
    ],
    scheduleSlugs: ['panama-2-2-3', 'pitman', 'dupont', '4-on-4-off-days-and-nights'],
  },
  {
    slug: 'factory-workers',
    title: 'Shift calendar for factory and plant workers',
    audience: 'factory, plant and manufacturing shift workers',
    summary: 'Turn your crew rotation into a calendar you can actually plan around.',
    pains: [
      'Continental and 2-2-4 rotations switch between days and nights every few days.',
      'The plant roster lives on a noticeboard, not in your phone.',
      'Overtime and swapped shifts are hard to keep track of for pay.',
    ],
    scheduleSlugs: ['2-2-4', '4-on-4-off', '4-on-4-off-days-and-nights', 'pitman', 'dupont'],
  },
  {
    slug: 'paramedics',
    title: 'Shift calendar for paramedics and EMS',
    audience: 'paramedics and EMS crews',
    summary: 'Plan rest, study and leave around 12- and 24-hour shifts.',
    pains: [
      'Long shifts and late finishes make it easy to lose track of the week.',
      'Recertification courses and study have to fit around the roster.',
      'Incidents on shift need a dated, written record.',
    ],
    scheduleSlugs: ['24-48', '4-on-4-off', '2-2-4', 'panama-2-2-3'],
  },
]

export function audienceBySlug(slug: string): AudienceGuide | undefined {
  return AUDIENCES.find((audience) => audience.slug === slug)
}

/** Public URLs these guides add to the site. */
export function guidePaths(): string[] {
  return [
    '/tools/shift-calculator',
    '/schedules',
    ...SCHEDULES.map((schedule) => `/schedules/${schedule.slug}`),
    ...AUDIENCES.map((audience) => `/for/${audience.slug}`),
  ]
}
