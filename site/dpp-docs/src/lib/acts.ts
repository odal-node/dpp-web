// acts.ts — passport dates, read from the instrument records vendored from
// dpp-core (site/dpp-landing/core-source.json pins the commit; check:core holds
// this copy to it).
//
// A regulatory page writes <PassportDate act="…" /> instead of a date, so the
// docs, the landing site and the software cannot disagree about one. An act
// with no passport date the core records as read from the text fails the build:
// a blank or guessed date on a regulatory page is worse than no page.
type Instrument = {
  id: string;
  passport: { obligation: string; from?: { date: string; basis: 'sourced' | 'assumed' } };
};

const modules = import.meta.glob('../data/instruments/*.json', { eager: true });
const byId = new Map(
  Object.values(modules).map((m: any) => {
    const i = (m.default ?? m) as Instrument;
    return [i.id, i];
  }),
);

const LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// Spelled out rather than left to Intl, whose en-GB short form for September
// is "Sept" in current ICU data and "Sep" in older.
const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "18 February 2027", or "18 Feb 2027" in tables. */
export function passportDate(act: string, form: 'long' | 'short' = 'long'): string {
  const instrument = byId.get(act);
  if (!instrument) throw new Error(`PassportDate: no vendored instrument "${act}".`);
  const from = instrument.passport.from;
  if (!from || from.basis !== 'sourced') {
    throw new Error(`PassportDate: "${act}" records no passport date read from the text.`);
  }
  const [year, month, day] = from.date.split('-').map(Number);
  return `${day} ${(form === 'short' ? SHORT : LONG)[month - 1]} ${year}`;
}
