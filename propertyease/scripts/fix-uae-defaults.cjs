// One-off script: replace UAE defaults in PropertyModal.tsx with Qatar.
// UAE is still a valid country in the CountryContext list, so we don't
// touch that — we only change the *defaults* in the create-property
// form and the example placeholders.
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'components', 'PropertyModal.tsx');
let src = fs.readFileSync(file, 'utf8');
const orig = src;

const replacements = [
  // Default country for new property form
  [`const [country, setCountry] = useState('UAE');`,
   `const [country, setCountry] = useState('Qatar');`],
  // Default country when editing existing property (fallback)
  [`setCountry(property.country || 'UAE');`,
   `setCountry(property.country || 'Qatar');`],
  // In case there are multiple "UAE" assignment sites
  [`setCountry('UAE');`,
   `setCountry('Qatar');`],
  // Address placeholder
  [`placeholder="e.g. Palm Jumeirah, Dubai"`,
   `placeholder="e.g. Najma Street, Al Mansura"`],
  // City placeholder + datalist
  [`placeholder="e.g. Dubai"`,
   `placeholder="e.g. Doha"`],
  [`                  <option value="Dubai" />
                  <option value="Abu Dhabi" />
                  <option value="Sharjah" />
                  <option value="Ajman" />
                  <option value="Ras Al Khaimah" />
                  <option value="Fujairah" />
                  <option value="Umm Al Quwain" />
                  <option value="Abu Musa" />`,
   `                  <option value="Doha" />
                  <option value="Al Rayyan" />
                  <option value="Al Wakrah" />
                  <option value="Al Khor" />
                  <option value="Lusail" />
                  <option value="Al Thumama" />
                  <option value="The Pearl" />
                  <option value="Msheireb" />`],
];

let count = 0;
for (const [from, to] of replacements) {
  if (src.includes(from)) {
    src = src.replace(from, to);
    count++;
    console.log(`✓ ${from.slice(0, 50)}...`);
  } else {
    console.log(`✗ (already fixed or not found) ${from.slice(0, 50)}...`);
  }
}

fs.writeFileSync(file, src, 'utf8');
console.log(`\nOK: ${count} replacements applied. ${orig.length} → ${src.length} bytes.`);
