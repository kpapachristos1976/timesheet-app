import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';
import { USER_MANUAL } from './userManualContent';

export async function generateWordManual() {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: 'CapacityView',
          bold: true,
          size: 56,
          color: '2563EB',
          font: 'Calibri',
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: 'User Manual',
          bold: true,
          size: 36,
          color: '475569',
          font: 'Calibri',
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
      },
      children: [
        new TextRun({
          text: `Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
          size: 22,
          color: '94A3B8',
          font: 'Calibri',
        }),
      ],
    })
  );

  for (const section of USER_MANUAL) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        children: [
          new TextRun({
            text: section.title,
            bold: true,
            size: 32,
            color: '1E293B',
            font: 'Calibri',
          }),
        ],
      })
    );

    for (const line of section.content) {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: line,
              size: 22,
              font: 'Calibri',
            }),
          ],
        })
      );
    }

    if (section.subsections) {
      for (const sub of section.subsections) {
        children.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
            children: [
              new TextRun({
                text: sub.title,
                bold: true,
                size: 26,
                color: '334155',
                font: 'Calibri',
              }),
            ],
          })
        );

        for (const line of sub.content) {
          children.push(
            new Paragraph({
              spacing: { after: 80 },
              indent: { left: 360 },
              children: [
                new TextRun({
                  text: line,
                  size: 22,
                  font: 'Calibri',
                }),
              ],
            })
          );
        }
      }
    }
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, 'CapacityView_User_Manual.docx');
}
