#!/usr/bin/env python3
"""Write the Antibody and Protein user guides as Word documents."""

import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs"

CONTENT_TYPES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>
"""

RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>
"""

DOC_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>
"""

STYLES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
      <w:sz w:val="22"/><w:szCs w:val="22"/>
    </w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr>
      <w:spacing w:after="160" w:line="276" w:lineRule="auto"/>
    </w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Title">
    <w:name w:val="Title"/>
    <w:basedOn w:val="Normal"/>
    <w:qFormat/>
    <w:pPr><w:spacing w:before="0" w:after="80"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="40"/><w:szCs w:val="40"/><w:color w:val="1F4E79"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle">
    <w:name w:val="Subtitle"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:spacing w:after="280"/></w:pPr>
    <w:rPr><w:i/><w:color w:val="5B6770"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:pPr><w:keepNext/><w:spacing w:before="360" w:after="80"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/><w:color w:val="1F4E79"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:pPr><w:keepNext/><w:spacing w:before="240" w:after="40"/></w:pPr>
    <w:rPr><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/><w:color w:val="2E75B6"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="ListBullet">
    <w:name w:val="List Bullet"/>
    <w:basedOn w:val="Normal"/>
    <w:pPr><w:ind w:left="720" w:hanging="360"/><w:spacing w:after="60"/></w:pPr>
  </w:style>
</w:styles>
"""

NUMBERING = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:abstractNum w:abstractNumId="0">
    <w:multiLevelType w:val="hybridMultilevel"/>
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="bullet"/>
      <w:lvlText w:val="•"/>
      <w:lvlJc w:val="left"/>
      <w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>
      <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/></w:rPr>
    </w:lvl>
  </w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
</w:numbering>
"""


def core(title: str) -> str:
    return f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:title>{escape(title)}</dc:title>
  <dc:subject>Protein Chain Workbench, version 3</dc:subject>
  <dc:creator>Protein Chain Workbench</dc:creator>
  <cp:lastModifiedBy>Protein Chain Workbench</cp:lastModifiedBy>
</cp:coreProperties>
"""


def paragraph(text: str, style: str | None = None, bullet: bool = False) -> str:
    props = []
    if style:
        props.append(f'<w:pStyle w:val="{style}"/>')
    if bullet:
        props.append("<w:numPr><w:ilvl w:val=\"0\"/><w:numId w:val=\"1\"/></w:numPr>")
    ppr = f"<w:pPr>{''.join(props)}</w:pPr>" if props else ""
    return f'<w:p>{ppr}<w:r><w:t xml:space="preserve">{escape(text)}</w:t></w:r></w:p>'


def document(blocks: list[tuple[str, str]]) -> str:
    body = []
    for kind, text in blocks:
        if kind == "title":
            body.append(paragraph(text, "Title"))
        elif kind == "sub":
            body.append(paragraph(text, "Subtitle"))
        elif kind == "h1":
            body.append(paragraph(text, "Heading1"))
        elif kind == "h2":
            body.append(paragraph(text, "Heading2"))
        elif kind == "li":
            body.append(paragraph(text, "ListBullet", bullet=True))
        else:
            body.append(paragraph(text))
    body.append(
        "<w:sectPr>"
        '<w:pgSz w:w="12240" w:h="15840"/>'
        '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="720" w:footer="720" w:gutter="0"/>'
        "</w:sectPr>"
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        f"<w:body>{''.join(body)}</w:body></w:document>"
    )


def write_docx(path: Path, title: str, blocks: list[tuple[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", CONTENT_TYPES)
        archive.writestr("_rels/.rels", RELS)
        archive.writestr("word/_rels/document.xml.rels", DOC_RELS)
        archive.writestr("word/styles.xml", STYLES)
        archive.writestr("word/numbering.xml", NUMBERING)
        archive.writestr("word/document.xml", document(blocks))
        archive.writestr("docProps/core.xml", core(title))


ANTIBODY: list[tuple[str, str]] = [
    ("title", "Antibody user guide"),
    ("sub", "Protein Chain Workbench, version 3  ·  1 November 2026"),
    (
        "p",
        "Use Antibody when the molecule is an antibody panel: a registered panel from Luma, or a panel you design in the workbench. The path runs from the request, through the chain and the construct, to expression, a recipe report, and a GaaL assembly job.",
    ),
    (
        "p",
        "Protein, the other button at the top, is the path for a receptor, a scaffold, or an antigen. That path has its own guide.",
    ),
    ("h1", "The screen"),
    (
        "p",
        "Open the workbench and press Antibody. The window has three columns. The left column is the list you are working from. The center is the step you selected. The right column is the Viewer.",
    ),
    ("li", "Drag the edge between columns to give one column more room. Double-click that edge to put the width back."),
    ("li", "Expand View hides the side columns so the center fills the window. Restore View brings them back."),
    ("li", "Theme changes the colors."),
    (
        "p",
        "The workbench keeps your open panel, nucleotide choices, and expression plan in the browser you are using. Another browser, or cleared site data, starts from the registered catalog again.",
    ),
    ("h1", "The tabs"),
    ("p", "The tabs across the top are the antibody steps. The count under each name is where that step stands."),
    ("li", "Request opens a registered panel or a draft you started."),
    ("li", "Chain lists each designed protein and the nucleotide string you want to build."),
    ("li", "Variable regions and Mutations appear only while a new panel is still being designed."),
    ("li", "Construct is how many plasmids you will express with."),
    ("li", "Expression is the host, the codon table, and transient or stable production."),
    (
        "p",
        "A registered panel already carries its chains and mutations, so Variable regions and Mutations stay off the header. They return when you start a new panel that does not yet have molecules. The numbers on Construct and Expression shift by two while those tabs are present. The Expression page itself stays marked Level 5.",
    ),
    ("h1", "Request"),
    ("p", "The left column is Requests."),
    ("li", "New starts a draft."),
    ("li", "Search matches a request name or a panel UID."),
    ("li", "Drafts are panels you started here. Registered in Luma are panels already stored. The list leads with the newest. Search to reach an older panel."),
    ("li", "Open a row to work on that panel. Delete a draft from its row when you no longer need it."),
    (
        "p",
        "Each panel, molecule, and chain has a UID. A grouped set of molecules is what receives the panel UID. Opening a registered panel reads the chains and mutations from the molecule in each well. You do not choose those again.",
    ),
    (
        "p",
        "A new request uses the design pad in the center. Place building blocks on the arms. Shape is the block and color is the sequence. A symmetric design calls for a homodimeric Fc. An asymmetric design calls for a heterodimer, with a knob on one heavy chain and a hole on the other. A Fab or crossed Fab asks which light chain to use: one light chain shared by both arms, or one light chain per arm.",
    ),
    ("h1", "Chain"),
    (
        "p",
        "Open Chain after the panel is open. Each well is its own molecule. Two wells can share a format and still carry different variable regions. That difference changes the construct count and the expression ratio, for example 1:1:1:1 or 2:2.",
    ),
    ("h2", "Preferred sequences"),
    (
        "p",
        "Preferred sequences lists every region, including regions that have only one translation. The id on each row came from the panel well, so you can see which molecule and which chain it belongs to. A shared insert uses the panel id. A chain with more than one insert adds that insert’s label.",
    ),
    ("li", "Drag the vertical divider to widen the protein column and read the amino-acid sequence. Double-click the divider to reset it."),
    ("li", "Each codon category shows DNA. The count opens the registered nucleotide strings for that category."),
    ("li", "Check the category to use string 1. Check a later string, such as the 6th, to use that registration. The Preferred tag stays on the category."),
    ("li", "A universal light chain can carry more than one characterized translation. Check the string you want for that chain."),
    (
        "p",
        "Drag the horizontal bar between the sequences and the table underneath to give one or the other more room. Double-click that bar to reset it.",
    ),
    ("h1", "Variable regions and Mutations"),
    (
        "p",
        "Use these tabs only while you are designing a panel. Choose the variable regions and the mutations before the panel is treated as registered. When you open a panel that is already in Luma, those choices are already in each well, and the tabs are hidden.",
    ),
    ("h1", "Construct"),
    (
        "p",
        "Construct asks how many constructs to express with. The buttons are the ways to split that molecule’s chains across plasmids. A four-chain molecule can be one chain on each plasmid (1×1×1×1), two chains on each of two plasmids (2×2), or all four chains on one plasmid.",
    ),
    ("li", "The label on a button is that split. The note under the buttons says what the split means for the ratio."),
    ("li", "A plasmid that carries more than one chain needs a multi-gene backbone. Plasmids in inventory carry one chain."),
    ("li", "A chain that changes with the well, such as a variable region, is built once per well. A chain that is the same in every well is built once for the panel."),
    ("li", "When the panel has more than one well, each button shows how many constructs that choice produces across the panel."),
    (
        "p",
        "The left column also designates how those constructs are kept and checked. Color covers chromogenic screening, such as blue/white lacZα, GUS, XylE, chromoproteins, the carotenoid pathway, and yeast ade2 red/white. Fluorescence covers a GFP, sfGFP, or mCherry fusion, split GFP, FACS, FlAsH/ReAsH, and an IRES or 2A-linked fluorescent protein. DNA selection covers the genetic markers (bacterial antibiotics, mammalian antibiotics, auxotrophy, DHFR, glutamine synthetase, counterselection, and antibiotic-free systems) and the checks that confirm the plasmid (colony PCR, a diagnostic digest, Sanger sequencing, and full-plasmid sequencing). Color and fluorescence screen colonies that all grow. A marker selects. The DNA checks confirm and do not select. The catalog facet named Selection marker still filters plasmids by the antibiotic already on them.",
    ),
    ("h1", "Expression"),
    (
        "p",
        "Expression is marked Level 5. Choose the protein class first. That choice narrows the expression system, and the system fixes the vector elements and the codon table used to recode each insert.",
    ),
    ("h2", "1. Target protein class"),
    ("li", "Soluble, secreted."),
    ("li", "Soluble, intracellular."),
    ("li", "Membrane. A membrane protein is a poor fit for E. coli before any cassette is chosen."),
    ("h2", "2. Expression system"),
    (
        "p",
        "Choose E. coli, Yeast (Pichia or S. cerevisiae), Insect (baculovirus, Sf9), Mammalian (CHO or HEK293), or Cell-free. The highlighted column is the one that will be registered. Choosing a host sets its codon table. Mammalian offers a human table for HEK293 and a CHO table.",
    ),
    ("h2", "3. Production scenario"),
    ("li", "Transient is many constructs, a small to moderate amount of each, and a fast turnaround. The DNA stays episomal. Expression peaks and then declines, and every batch is a new transfection."),
    ("li", "Stable is few constructs, large scale, and a slow turnaround. The cassette is maintained in the host, and a sequence change after that point starts the line again."),
    (
        "p",
        "The page also describes a stable pool, which is selected but not cloned, and the handoff from transient material to stable material. Glycosylation, charge variants, and bispecific mispairing can shift between transient HEK material and stable CHO material, so check developability again at that point.",
    ),
    ("h2", "4. Codon optimization"),
    ("li", "Host codon adaptation recodes each insert toward the codons this host uses most often."),
    ("li", "Codon harmonization keeps the source organism’s rare-codon rhythm, mapped onto this host."),
    ("li", "Rare-codon replacement changes only codons that are rare in this host and leaves the rest of the insert as it is."),
    ("li", "Keep the current coding sequence leaves each insert as written. The host still sets the vector elements around it."),
    (
        "p",
        "The inserts at the bottom are the chains included on the construct step. If that list is empty, include a chain on Level 1. Its inserts are what this codon table recodes. Vector elements stay on the construct. The host sets the promoter, the translation start, the termination, the secretion signal, and the selection around the recoded insert.",
    ),
    ("h1", "The Viewer"),
    ("p", "The Viewer stays on the right through the antibody steps. Its tabs are Info, Backbone, Text, and Saved."),
    ("h2", "Info"),
    (
        "p",
        "Info shows the current selection and anything the panel asks you to check. When there is work to hand off, three actions sit at the bottom.",
    ),
    ("li", "Register constructs appears on the Construct tab after you choose how many constructs to express with and that choice produces constructs. It stays off Request, Chain, Variable regions, Mutations, and Expression. On Construct it stays disabled until a target class, a host, a codon table, a codon method, and transient or stable are all set. Hover the button to see what is still missing. Registering the same constructs with the same choice again leaves the button on Registered."),
    ("li", "Copy build list puts a plain-text summary on the clipboard."),
    ("li", "Publish protein Report downloads a PDF recipe for the panel. The file name starts with protein-recipe and the panel id."),
    (
        "p",
        "Each registration is numbered EXP-001, EXP-002, and so on. Antibody registrations are kept apart from Protein registrations, so each mode numbers its own list.",
    ),
    ("h2", "Backbone and Saved"),
    (
        "p",
        "Backbone lists destination backbones for the constructs in play. Rule one out with the × on its chip, or restore it from Ruled out on Info. Saved keeps backbone presets you want to reuse.",
    ),
    ("h2", "Text and GaaL"),
    (
        "p",
        "Text is the handoff to assembly. It counts the builds, the variable regions, and the assemblies those parts become.",
    ),
    ("li", "Copy GaaL job copies the assembly as JSON. The library is GaaL and the job is a golden-gate assembly."),
    ("li", "Copy as CSV copies the same rows for a spreadsheet. The columns are build, slot, domain, part, backbone, enzyme, overhangs, product, and selection."),
    (
        "p",
        "The button reads Copied for a moment. Point the job at your Geneious Prime library to run the builds. The copied text is the assembly spec. The Geneious sequence viewer itself runs inside Geneious Prime.",
    ),
    ("h1", "A short path"),
    ("li", "Press Antibody."),
    ("li", "Open a registered panel, or press New and design the molecule."),
    ("li", "On Chain, check the nucleotide string for each region."),
    ("li", "On Construct, choose how many constructs to express with, then register them."),
    ("li", "On Expression, set the class, the host, transient or stable, and the codon method."),
    ("li", "In the Viewer, publish the recipe or copy the GaaL job."),
]

PROTEIN: list[tuple[str, str]] = [
    ("title", "Protein user guide"),
    ("sub", "Protein Chain Workbench, version 3  ·  1 November 2026"),
    (
        "p",
        "Use Protein when the molecule is a receptor, a scaffold, or an antigen, rather than an antibody panel. You bring in a sequence, inspect it, place it on a cloning panel, choose the construct scheme, and set the expression strategy. The Viewer then publishes a recipe and copies a GaaL assembly job.",
    ),
    (
        "p",
        "Antibody, the other button at the top, is the path for a Luma antibody panel. That path has its own guide. The two modes keep their drafts and their expression registrations separate.",
    ),
    ("h1", "The screen"),
    (
        "p",
        "Open the workbench and press Protein. The window has three columns. The left column is the protein list or the cloning panel, depending on the tab. The center is the step you selected. The right column is the Viewer.",
    ),
    ("li", "Drag the edge between columns to give one column more room. Double-click that edge to put the width back."),
    ("li", "Expand View hides the side columns so the center fills the window. Restore View brings them back."),
    ("li", "Theme changes the colors."),
    (
        "p",
        "The workbench keeps your drafts, the cloning panel, the construct scheme, and the expression plan in the browser you are using. Another browser, or cleared site data, starts from the registered catalog again.",
    ),
    ("h1", "The tabs"),
    ("p", "Three tabs run across the top. The count under each name is where that step stands."),
    ("li", "Protein is the draft count, such as 1 draft."),
    ("li", "1 Construct shows how many proteins are on the cloning panel and their ratio, such as 1 · 1. It reads choose until a protein is on the panel."),
    ("li", "2 Expression shows the production scenario and the host, and the number of expression registrations once you have stored one. It reads choose until a scenario or a host is set."),
    (
        "p",
        "A protein sequence already carries its chain and its annotations, so this path does not add variable-region or mutation tabs. Those belong to an antibody panel that is still being designed.",
    ),
    ("h1", "Find or start a protein"),
    ("p", "The left column on the Protein tab is Proteins. New starts a draft. Search matches a name, an id, an accession, or a stored sequence. Singular and plural both match, so Affibody finds Affibodies."),
    ("p", "The list is grouped."),
    ("li", "Drafts are proteins you started or brought in. A new draft is numbered PRT-R001, PRT-R002, and so on. That id stays with the protein when you build from it."),
    ("li", "Receptors. TCR is PRT-001, a T-cell receptor registered as its own protein."),
    ("li", "Human-derived scaffolds: Anticalins, DARPins, Affilin, Adnectins / Monobodies, Avimers, and Kunitz domains."),
    ("li", "Non-human-derived scaffolds: Affibodies and Nanofitins."),
    ("li", "Other engineered scaffolds: Fynomers, Knottins, and β-Hairpin mimetics."),
    (
        "p",
        "Open a registered scaffold to read its card. Start a new protein from this copies that scaffold into a draft you can edit. On the draft, set the class, the therapeutic area, and a note. The therapeutic areas are targeted drug delivery, and receptor antagonism or ligand neutralization.",
    ),
    (
        "p",
        "A catalog card such as TCR does not carry an amino-acid sequence. The sequence viewer appears after you bring a sequence onto the draft.",
    ),
    ("h1", "Search"),
    ("p", "On a new draft, search before you clone. Two sources and two ways to search:"),
    ("li", "Internal, by name, matches registered receptors and scaffolds, and proteins already brought in."),
    ("li", "Internal, by sequence, matches a sequence already stored on a draft. A fragment of at least eight residues is enough for that search."),
    ("li", "UniProt, by name, gene, or accession, brings the accession, the sequence, and the metadata from UniProt. Reviewed entries only limits the search to reviewed records."),
    ("li", "UniProt, by sequence, matches the full sequence. A fragment is found among proteins already stored here, not as a partial UniProt search."),
    (
        "p",
        "Select a hit to copy it onto the draft. Insulin, for example, arrives as accession P01308, entry INS_HUMAN, gene INS, organism Homo sapiens, and its amino-acid sequence, together with the features UniProt records for that entry. Delete the draft from the left column when you no longer need it.",
    ),
    ("h1", "Read the sequence"),
    (
        "p",
        "Once the draft has a sequence, the center shows the sequence viewer. This is the workbench view of the protein. The Geneious plugin viewer itself runs inside Geneious Prime.",
    ),
    ("li", "Zoom out and Zoom in change the residue size. At a high zoom, amino acids are shown as three-letter codes when you are not editing."),
    ("li", "Amino acids and Reverse translation turn those rows on or off. The DNA row is the reverse translation of the preferred codon category, or of the registered string you checked."),
    ("li", "Annotations shows or hides every bar at once. The list of annotations stays. Uncheck one annotation to hide that bar and leave the others. Overlapping spans stack in separate lanes, so a long feature list remains readable."),
    ("li", "A map above the residues draws every annotation across the whole sequence, fitted to the panel. Linear keeps the residues on one scrolling row, so click a bar in the map to bring that part of the sequence into view. Wrap fits each row to the width of the viewer and numbers the first residue of each row."),
    ("li", "Edit sequence lets you change the amino acids. Done editing returns to the residue view."),
    ("li", "Add an annotation with a type, a name, and a start and end. Click a bar to move the cursor to that span."),
    (
        "p",
        "A UniProt import includes the chain plus every feature on that entry: signal, transit and propeptide, chain and peptide, domains and repeats, sites, disulfide bonds and other links, modifications, variants and conflicts, mutagenesis, secondary structure, sequence uncertainty, and non-adjacent residues. A natural variant is named by its substitution, such as R to C, with the UniProt description kept as the note. A search you saved before features were imported shows the chain bar until you search that entry again.",
    ),
    ("h1", "Preferred translation and the cloning panel"),
    (
        "p",
        "Under the sequence, Preferred translation lists the codon categories already characterized for the protein, such as CHO high-frequency, Human harmonized, and Germline nucleotides. Check a category to use its first registered string. Open the category and check a later string to use that registration. The Preferred tag stays on the category.",
    ),
    ("p", "Then say how this protein enters cloning."),
    ("li", "Cloning role. Stoichiometry is several chains in a fixed ratio, as with a TCR. Scaffold is a scaffold to build from. Antigen is a protein to make for an assay."),
    ("li", "Parts in the mix is that protein’s share. A scaffold or an antigen is usually one part."),
    ("li", "Add to cloning panel places it on the construct step. Remove from cloning panel takes it off. Only a protein that has a sequence can join the panel."),
    (
        "p",
        "The Protein tab then notes how many proteins are on the construct tab, the ratio, and the scheme. Expression itself is chosen on the Expression tab.",
    ),
    ("h1", "Construct"),
    (
        "p",
        "Open 1 Construct. The left column lists the proteins on the panel, then the same Color, Fluorescence, and DNA selection choices used for an antibody construct. Select a protein to return to the Protein tab on that draft. The center is Level 1.",
    ),
    ("li", "One co-transfection puts every protein in one transfection mix. Parts are each protein’s share, and the ratio joins those parts, such as 1:2."),
    ("li", "One plasmid per protein gives each protein its own transfection. Parts still record the planned mix."),
    ("li", "Edit Parts beside a protein to change its share. The ratio on the tab updates."),
    (
        "p",
        "No destination backbone is registered for a protein panel. The screen says so. The GaaL job names each protein and carries its reverse translation. It does not invent a plasmid id, an enzyme, or overhangs.",
    ),
    ("h1", "Expression"),
    (
        "p",
        "Open 2 Expression. The page is marked Level 2. The choices are the same kind of host bench used for an antibody, applied to the proteins on the cloning panel.",
    ),
    ("h2", "1. Target protein class"),
    ("li", "Soluble, secreted."),
    ("li", "Soluble, intracellular."),
    ("li", "Membrane. A membrane protein is a poor fit for E. coli before any cassette is chosen."),
    ("h2", "2. Expression system"),
    (
        "p",
        "Choose E. coli, Yeast (Pichia or S. cerevisiae), Insect (baculovirus, Sf9), Mammalian (CHO or HEK293), or Cell-free. The highlighted column is the one that will be registered. Choosing a host updates the codon table. Mammalian offers a human table for HEK293 and a CHO table.",
    ),
    ("h2", "3. Production scenario"),
    ("li", "Transient is many constructs, a small to moderate amount of each, and a fast turnaround."),
    ("li", "Stable is few constructs, large scale, and a slow turnaround."),
    (
        "p",
        "The figures on the page for volume and titer are the mammalian antibody figures for HEK293 and CHO. Read them as the scale of those scenarios. A stable pool is selected but not cloned and sits between a transient run and a clonal line.",
    ),
    ("h2", "4. Codon optimization"),
    ("li", "Host codon adaptation recodes each insert toward the codons this host uses most often."),
    ("li", "Codon harmonization keeps the source organism’s rare-codon rhythm, mapped onto this host."),
    ("li", "Rare-codon replacement changes only codons that are rare in this host."),
    ("li", "Keep the current coding sequence leaves the insert as written. The host still sets the vector elements around it."),
    (
        "p",
        "Inserts this choice applies to lists each protein on the panel, the translation you chose, the cloning role, and the host the insert is optimized for. If the panel is empty, the page asks you to add a protein. Its sequence is what this codon table recodes. Vector elements stay on the construct. The host sets the promoter, the translation start, the termination, the secretion signal, and the selection around the recoded insert.",
    ),
    ("h1", "The Viewer"),
    (
        "p",
        "The Viewer is on the right on all three protein tabs. Its tabs are Info and Text.",
    ),
    ("h2", "Info"),
    ("p", "Info summarizes the cloning panel: how many proteins, the ratio, the scheme, and each protein’s id, role, and parts. It also states that no destination backbone is registered, and it lists the expression lines you have set, including any EXP registration."),
    ("li", "Register constructs appears on the Construct tab once a protein is on the cloning panel. It stays off the Protein and Expression tabs. On Construct it stays disabled until a target class, an expression system, a codon table, a codon strategy, and transient or stable are all set. Hover the button to see what is still missing. The same proteins with the same expression choice stay Registered and are not stored twice."),
    ("li", "Copy build list puts a plain-text summary of the panel, the scheme, and the expression lines on the clipboard."),
    ("li", "Publish protein Report downloads a PDF named protein-recipe, followed by the panel id. The report is titled Protein Recipe Report. It lists the scheme, the ratio, each protein’s id, name, accession, role, parts, and translation, the backbone note, and the expression lines."),
    (
        "p",
        "A registration is numbered EXP-001, EXP-002, and so on, on the protein list only. An antibody registration with the same number is a different record. The Expression tab count includes how many protein registrations you have stored. Changing the panel or the expression choice lets you register again.",
    ),
    ("h2", "Text and GaaL"),
    ("p", "Text counts the GaaL assemblies and the protein inserts."),
    ("li", "One co-transfection copies one job. The product joins the protein ids with a plus sign."),
    ("li", "One plasmid per protein copies one job per protein."),
    ("li", "Copy GaaL job copies that JSON. The library is GaaL and the job is golden_gate_assembly."),
    ("li", "Copy as CSV copies the same rows. The columns match the antibody handoff: build, slot, domain, part, backbone, enzyme, overhang_5, overhang_3, product, and selection."),
    (
        "p",
        "Each insert’s part is the reverse-translated DNA for the translation you checked. The domain is the cloning role. Visible annotation names are included. Hidden annotations are left out. Backbone, enzyme, overhangs, and selection stay empty until a destination plasmid is registered. Point the job at your Geneious Prime library to run the builds.",
    ),
    ("h1", "A short path"),
    ("li", "Press Protein, then New."),
    ("li", "Search UniProt or the proteins already stored here, and select the hit."),
    ("li", "Read the sequence. Check the preferred translation. Set the cloning role and the parts, then add it to the cloning panel."),
    ("li", "On Construct, choose one co-transfection or one plasmid per protein, then register the constructs."),
    ("li", "On Expression, set the class, the host, transient or stable, and the codon method."),
    ("li", "In the Viewer, publish the recipe or copy the GaaL job."),
]


def main() -> None:
    write_docx(OUT / "Antibody-user.docx", "Antibody user guide", ANTIBODY)
    write_docx(OUT / "Protein-user.docx", "Protein user guide", PROTEIN)
    print(f"wrote {OUT / 'Antibody-user.docx'}")
    print(f"wrote {OUT / 'Protein-user.docx'}")


if __name__ == "__main__":
    main()
