// To support Intl.getCanonicalLocales. This is supposed to be included in a
// a future ts version and should be removed whenever that happens
//
// See: https://github.com/microsoft/TypeScript/issues/29129#issuecomment-1828749363
declare namespace Intl {
  function getCanonicalLocales(locales: string | string[]): string[];
}
