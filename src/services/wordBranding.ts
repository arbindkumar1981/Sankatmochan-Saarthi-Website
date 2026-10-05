import JSZip from 'jszip';
import type { BrandingImages } from './noteBranding';
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const REL = 'http://schemas.openxmlformats.org/package/2006/relationships';
const parse = (text: string) => {
  if (/<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error('Unsupported Word XML declarations.');
  const xml = new DOMParser().parseFromString(text, 'application/xml');
  if (xml.getElementsByTagName('parsererror').length) throw new Error('Invalid Word document.');
  return xml;
};
const escape = (text: string) => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]!));
const serialize = (xml: Document) => new XMLSerializer().serializeToString(xml);

export async function brandDocx(source: Uint8Array, branding: BrandingImages): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(source);
  if (Object.keys(zip.files).length > 3000) throw new Error('Word file is too complex. Export it as PDF before uploading.');
  const documentEntry = zip.file('word/document.xml'), typesEntry = zip.file('[Content_Types].xml');
  if (!documentEntry || !typesEntry) throw new Error('Use a valid .docx file.');
  const documentXml = parse(await documentEntry.async('string'));
  const types = parse(await typesEntry.async('string'));
  const relsPath = 'word/_rels/document.xml.rels';
  const rels = parse(await zip.file(relsPath)?.async('string') || `<Relationships xmlns="${REL}"/>`);
  const id = crypto.randomUUID().replaceAll('-', '');
  const logoName = `saarthi-${id}.png`;
  zip.file(`word/media/${logoName}`, branding.logo);
  if (!Array.from(types.getElementsByTagName('Default')).some(el => el.getAttribute('Extension') === 'png')) {
    const element = types.createElementNS(types.documentElement.namespaceURI, 'Default'); element.setAttribute('Extension', 'png'); element.setAttribute('ContentType', 'image/png'); types.documentElement.append(element);
  }
  const paragraph = `<w:p xmlns:w="${W}" xmlns:r="${R}" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><w:r><w:drawing><wp:inline><wp:extent cx="2200000" cy="${Math.round(2200000 / (branding.logoAspectRatio || 3))}"/><wp:docPr id="${Math.floor(Math.random()*1000000)+1000000}" name="Saarthi logo"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="Saarthi logo"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdSaarthiLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="2200000" cy="${Math.round(2200000 / (branding.logoAspectRatio || 3))}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r><w:r><w:pict><v:shapetype id="_x0000_t136" coordsize="21600,21600" o:spt="136" adj="10800" path="m@7,l@8,m@5,21600l@6,21600e"><v:textpath on="t" fitshape="t"/></v:shapetype><v:shape id="SaarthiWatermark${id}" type="#_x0000_t136" style="position:absolute;width:450pt;height:65pt;rotation:315;z-index:-251654144;mso-position-horizontal:center;mso-position-horizontal-relative:page;mso-position-vertical:center;mso-position-vertical-relative:page" fillcolor="#b8c4ce" stroked="f"><v:fill opacity="0.15"/><v:textpath style="font-family:Arial;font-size:1pt" string="${escape(branding.name)}"/></v:shape></w:pict></w:r></w:p>`;
  const sections = Array.from(documentXml.getElementsByTagNameNS(W, 'sectPr'));
  if (!sections.length) throw new Error('Word document has no page sections. Export it as PDF.');
  const headers = new Set<string>();
  const inheritedHeaders = new Map<string, string>();
  const newHeader = `saarthi-header-${id}.xml`, newRelation = `rIdSaarthi${id}`;
  for (const section of sections) {
    let margin = section.getElementsByTagNameNS(W, 'pgMar')[0];
    if (!margin) {
      margin = documentXml.createElementNS(W, 'w:pgMar');
      for (const [key, value] of Object.entries({ bottom: '1440', left: '1440', right: '1440', footer: '720', gutter: '0' })) margin.setAttributeNS(W, `w:${key}`, value);
      const following = Array.from(section.children).find(el => ['paperSrc', 'pgBorders', 'lnNumType', 'pgNumType', 'cols', 'formProt', 'vAlign', 'noEndnote', 'titlePg', 'textDirection', 'bidi', 'rtlGutter', 'docGrid', 'printerSettings', 'sectPrChange'].includes(el.localName));
      section.insertBefore(margin, following || null);
    }
    margin.setAttributeNS(W, 'w:top', String(Math.max(1440, Number(margin.getAttributeNS(W, 'top')) || 0))); margin.setAttributeNS(W, 'w:header', '360');
    for (const type of ['default', 'first', 'even']) {
      const reference = Array.from(section.getElementsByTagNameNS(W, 'headerReference')).find(el => el.getAttributeNS(W, 'type') === type);
      if (reference) {
        inheritedHeaders.set(type, reference.getAttributeNS(R, 'id')!);
        const relation = Array.from(rels.documentElement.children).find(el => el.getAttribute('Id') === reference.getAttributeNS(R, 'id'));
        const target = relation?.getAttribute('Target');
        if (!target || target.includes('..') || relation?.getAttribute('TargetMode') === 'External') throw new Error('Unsupported Word header. Export as PDF.');
        headers.add(target.startsWith('/') ? target.slice(1) : `word/${target}`);
      } else {
        const relationId = inheritedHeaders.get(type) || newRelation;
        const reference = documentXml.createElementNS(W, 'w:headerReference'); reference.setAttributeNS(W, 'w:type', type); reference.setAttributeNS(R, 'r:id', relationId); section.insertBefore(reference, section.firstChild);
        if (relationId === newRelation) headers.add(`word/${newHeader}`);
        inheritedHeaders.set(type, relationId);
      }
    }
  }
  const relation = rels.createElementNS(REL, 'Relationship'); relation.setAttribute('Id', newRelation); relation.setAttribute('Type', `${R}/header`); relation.setAttribute('Target', newHeader); rels.documentElement.append(relation);
  for (const path of headers) {
    const header = parse(await zip.file(path)?.async('string') || `<w:hdr xmlns:w="${W}"/>`);
    header.documentElement.insertBefore(header.importNode(parse(paragraph).documentElement, true), header.documentElement.firstChild);
    zip.file(path, serialize(header));
    const parts = path.split('/'), name = parts.pop()!;
    const headerRelsPath = `${parts.join('/')}/_rels/${name}.rels`;
    const headerRels = parse(await zip.file(headerRelsPath)?.async('string') || `<Relationships xmlns="${REL}"/>`);
    if (Array.from(headerRels.documentElement.children).some(el => el.getAttribute('Id') === 'rIdSaarthiLogo')) throw new Error('This Word file is already branded. Upload the original copy.');
    const logoRelation = headerRels.createElementNS(REL, 'Relationship'); logoRelation.setAttribute('Id', 'rIdSaarthiLogo'); logoRelation.setAttribute('Type', `${R}/image`); logoRelation.setAttribute('Target', `${'../'.repeat(Math.max(0, parts.length - 1))}media/${logoName}`); headerRels.documentElement.append(logoRelation); zip.file(headerRelsPath, serialize(headerRels));
    if (!Array.from(types.documentElement.children).some(el => el.getAttribute('PartName') === `/${path}`)) { const override = types.createElementNS(types.documentElement.namespaceURI, 'Override'); override.setAttribute('PartName', `/${path}`); override.setAttribute('ContentType', 'application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml'); types.documentElement.append(override); }
  }
  zip.file('word/document.xml', serialize(documentXml)); zip.file(relsPath, serialize(rels)); zip.file('[Content_Types].xml', serialize(types));
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}
