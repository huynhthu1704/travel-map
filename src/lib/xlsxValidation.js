/**
 * REQ-026 / REQ-029: extras for write-excel-file sheets.
 * - Drop-down lists (Excel data validation).
 * - Cached formula results: write-excel-file only stores the formula, so viewers that do not recalculate
 *   (Excel Protected View, previews) showed empty cells. Each sheet may carry `formulaValues: { A1: value }`;
 *   the value is written as the formula's cached result. Formulas are also stored without the leading "=".
 * Each sheet may carry `validations: [{ sqref: 'C2:C200', list: "'Master data'!$A$2:$A$5" }]`;
 * this feature writes them as <dataValidations> in the sheet XML, keeping the element order Excel requires.
 */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Elements that must come after <dataValidations> inside <worksheet>
const AFTER = ['hyperlinks', 'printOptions', 'pageMargins', 'pageSetup', 'headerFooter', 'rowBreaks', 'colBreaks', 'customProperties', 'cellWatches', 'ignoredErrors', 'smartTags', 'drawing', 'legacyDrawing', 'legacyDrawingHF', 'picture', 'oleObjects', 'controls', 'webPublishItems', 'tableParts', 'extLst'];

export function dataValidationsXml(validations = []) {
  if (!validations.length) return '';
  const items = validations
    .map((v) => `<dataValidation type="list" allowBlank="1" showErrorMessage="0" showInputMessage="0" sqref="${esc(v.sqref)}"><formula1>${esc(v.list)}</formula1></dataValidation>`)
    .join('');
  return `<dataValidations count="${validations.length}">${items}</dataValidations>`;
}

export function insertDataValidations(xml, validations) {
  const markup = dataValidationsXml(validations);
  if (!markup || xml.includes('<dataValidations')) return xml;
  let at = -1;
  for (const tag of AFTER) {
    const i = xml.search(new RegExp(`<${tag}[\\s/>]`));
    if (i !== -1 && (at === -1 || i < at)) at = i;
  }
  if (at === -1) at = xml.lastIndexOf('</worksheet>');
  return xml.slice(0, at) + markup + xml.slice(at);
}

/** Store formulas without the leading "=" and add their cached results */
export function addFormulaValues(xml, values = {}) {
  return xml.replace(/<c r="([A-Z]+\d+)"([^>]*)><f>=?([\s\S]*?)<\/f><\/c>/g, (m, ref, attrs, f) => {
    const v = values[ref];
    if (v === undefined || v === null || v === '') return `<c r="${ref}"${attrs}><f>${f}</f></c>`;
    if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}"${attrs.replace(/\s+t="[^"]*"/, '')}><f>${f}</f><v>${v}</v></c>`;
    return `<c r="${ref}"${attrs.replace(/\s+t="[^"]*"/, '')} t="str"><f>${f}</f><v>${esc(v)}</v></c>`;
  });
}

export const dataValidationFeature = {
  files: {
    transform: {
      'xl/worksheets/sheet{id}.xml': {
        transform: (content, sheetOptions) => insertDataValidations(addFormulaValues(content, sheetOptions?.formulaValues), sheetOptions?.validations),
      },
    },
  },
};
