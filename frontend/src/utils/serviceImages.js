const imageEntries = [
  ["BasicFootspa-with-Combo-Gel.jpg", ["basicfootspawithcombogel", "basicfootspacombogel"]],
  ["BasicFootspa-with-Mani-Ped.jpg", ["basicfootspawithmaniped", "basicfootspamaniped"]],
  ["BasicFootspa-with-Pedi-Gel.jpg", ["basicfootspawithpedigel", "basicfootspapedigel"]],
  ["BasicFootspa-with-Pedicure.jpg", ["basicfootspawithpedicure", "basicfootspapedicure"]],
  ["SignatureFootspa-with-Combo-Gel.jpg", ["signaturefootspawithcombogel", "signiturefootspawithcombogel", "signaturefootspacombogel"]],
  ["SignatureFootspa-with-Pedi-Gel.jpg", ["signaturefootspawithpedigel", "signiturefootspawithpedigel", "signaturefootspapedigel"]],
  ["SignitureFootspa-with-Mani-Ped.jpg", ["signaturefootspawithmaniped", "signiturefootspawithmaniped", "signaturefootspamaniped"]],
  ["SignitureFootspa-with-Pedicure.jpg", ["signaturefootspawithpedicure", "signiturefootspawithpedicure", "signaturefootspapedicure"]],
  ["BasicFootSpa.jpg", ["basicfootspa"]],
  ["SignitureFootSpa.jpg", ["signaturefootspa", "signiturefootspa"]],
  ["CatEyeLash.jpg", ["cateyelash", "cateyelashes"]],
  ["ClassicLash.jpg", ["classiclash", "classiclashes"]],
  ["VoluminousLash.jpg", ["voluminouslash", "voluminouslashes"]],
  ["EyebrowShaving.jpg", ["eyebrowshaving", "eyebrowshave"]],
  ["LashRemoval.jpg", ["lashremoval"]],
  ["GemStone-Small.jpg", ["gemstonesmall", "smallgemstone"]],
  ["GemStone-Big.jpg", ["gemstonebig", "biggemstone"]],
  ["SoftGelExtension.jpg", ["softgelextension", "softgelextensions"]],
  ["FrenchTip.jpg", ["frenchtip", "frenchtips"]],
  ["GelRemoval.jpg", ["gelremoval"]],
  ["ComboGel.jpg", ["combogel"]],
  ["Mani-GelPlain.jpg", ["manigelplain", "manicuregelplain"]],
  ["Pedi-GelPlain.jpg", ["pedigelplain", "pedicuregelplain"]],
  ["Mani-Ped.jpg", ["maniped", "manicurepedicure"]],
  ["Manicure.jpg", ["manicure", "mani"]],
  ["Pedicure.jpg", ["pedicure", "pedi"]],
  ["HairandMakeup.jpg", ["hairandmakeup", "hairmakeup"]],
  ["HairColor.jpg", ["haircolor", "haircolour", "coloring", "colouring", "highlights", "balayage"]],
  ["HairGlam.jpg", ["hairglam", "hairglamming"]],
  ["InspoDesign.jpg", ["inspodesign", "inspirationdesign"]],
  ["Haircut.jpg", ["haircut", "haircuts", "trim"]],
];

const normalize = (value = "") => String(value).toLowerCase().replace(/[^a-z0-9]/g, "");

export function getServiceImage(name, category = "") {
  const normalizedName = normalize(name);
  const match = imageEntries
    .flatMap(([file, aliases]) => aliases.map((alias) => ({ file, alias })))
    .filter(({ alias }) => alias.length >= 5 && normalizedName.includes(alias))
    .sort((a, b) => b.alias.length - a.alias.length)[0];

  if (match) return `/${match.file}`;

  const normalizedCategory = normalize(category);
  if (/nail|mani|pedi/.test(normalizedCategory)) return "/Manicure.jpg";
  if (/lash|brow|skin|facial|eye/.test(normalizedCategory)) return "/ClassicLash.jpg";
  if (/hair|cut|color|style/.test(normalizedCategory)) return "/Haircut.jpg";
  return "/BasicFootSpa.jpg";
}