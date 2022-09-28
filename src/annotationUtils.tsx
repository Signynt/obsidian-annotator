import { SAMPLE_PDF_URL } from './constants';
import { IHasAnnotatorSettings } from 'settings';
import AnnotatorPlugin from 'main';
import { Annotation, AnnotationList } from 'types';


const makeAnnotationBlockRegex = (annotationId?: string) => {
    const { useCustomMarkdown, customMarkdownHighlight } = AnnotatorPlugin.instance.settings.customMarkdownSettings;
    if (useCustomMarkdown) {
        return makeAnnotationBlockRegexCustom(annotationId);
    } else {
        return makeAnnotationBlockRegexDefault(annotationId);
    }
}


const makeAnnotationBlockRegexDefault = (annotationId?: string) =>
    new RegExp(
        '(?<annotationBlock>^\n(>.*?\n)*?>```annotation-json(\n>.*?)*?)\n\\^(?<annotationId>' +
            (annotationId ?? '[a-zA-Z0-9]+') +
            ')\n',
        'gm'
    );

const makeAnnotationBlockRegexCustom = (annotationId?:string) => {
    const { useCustomMarkdown, customMarkdownHighlight } = AnnotatorPlugin.instance.settings.customMarkdownSettings;

    const customMarkdownDictionaryRegex = {
        annotator_json: '(?<annotationJson>(.|\n)*?)',
        annotator_tags: '(?<tags>(.|\n)*?)',
        annotator_comment: '(?<comment>(.|\n)*?)',
        annotator_highlightedText: '(?<highlight>(.|\n)*?)',
        annotator_prefix: '(?<prefix>(.|\n)*?)',
        annotator_postfix: '(?<postfix>(.|\n)*?)',
        annotator_link: '(?<link>(.|\n)*?)',
        annotator_id: ')\\^(?<annotationId>' + (annotationId ?? '[a-zA-Z0-9]+') + ')\n'
    };

    const newcustomMarkdownHighlight = customMarkdownHighlight.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
    const customMarkdownHighlightReplaced = newcustomMarkdownHighlight.replace(/\b(?:annotator_json|annotator_tags|annotator_comment|annotator_highlightedText|annotator_prefix|annotator_postfix|annotator_link|annotator_id)\b/gi, matched => customMarkdownDictionaryRegex[matched])
    return new RegExp('(?<annotationBlock>' + customMarkdownHighlightReplaced, 'gm');
}

const getAnnotationFromAnnotationBlock = (annotationBlock: string, annotationId: string): Annotation => {
    const { useCustomMarkdown, customMarkdownHighlight } = AnnotatorPlugin.instance.settings.customMarkdownSettings;
    if (useCustomMarkdown) {
        var contentRegex = makeAnnotationContentRegexCustom();
        var content = annotationBlock;

    } else {
        var contentRegex = makeAnnotationContentRegex();
        var content = annotationBlock
            .split('\n')
            .map(x => x.substr(1))
            .join('\n');
    }

    const {
        groups: { annotationJson, prefix, highlight, postfix, comment, tags }
    } = contentRegex.exec(content);
    const annotation = JSON.parse(annotationJson);
    const annotationTarget = annotation.target?.[0];
    if (annotationTarget && 'selector' in annotationTarget) {
        annotationTarget.selector = annotationTarget.selector.map(x =>
            x.type == 'TextQuoteSelector'
                ? { ...x, prefix: prefix ?? x.prefix, exact: x.exact ?? highlight, suffix: postfix ?? x.suffix }
                : x
        );
    }
    annotation.text = comment;
    annotation.tags = tags
        .split(',')
        .map(x => x.trim().substr(1))
        .filter(x => x);
    if ('group' in annotation) {
        delete annotation.group;
    }

    return { ...makeDefaultAnnotationObject(annotationId, annotation.tags), ...annotation };
};

const makeAnnotationContentRegexCustom = (annotationId?:string) => {
    const { useCustomMarkdown, customMarkdownHighlight } = AnnotatorPlugin.instance.settings.customMarkdownSettings;

    const customMarkdownDictionaryRegex = {
        annotator_json: '(?<annotationJson>(.|\\n)*?)',
        annotator_tags: '(?<tags>(.|\\n)*?)',
        annotator_comment: '(?<comment>(.|\\n)*?)',
        annotator_highlightedText: '(?<highlight>(.|\\n)*?)',
        annotator_prefix: '(?<prefix>(.|\\n)*?)',
        annotator_postfix: '(?<postfix>(.|\\n)*?)',
        annotator_link: '(?<link>(.|\\n)*?)',
        annotator_id: ''
    };

    //const newcustomMarkdownHighlight = customMarkdownHighlight.replace(/(\n)/gi, '\\\\n');
    const newnewcustomMarkdownHighlight = customMarkdownHighlight.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
    const customMarkdownHighlightReplaced = newnewcustomMarkdownHighlight.replace(/\b(?:annotator_json|annotator_tags|annotator_comment|annotator_highlightedText|annotator_prefix|annotator_postfix|annotator_link|annotator_id)\b/gi, matched => customMarkdownDictionaryRegex[matched])
    return new RegExp(customMarkdownHighlightReplaced, 'g');
    //return new RegExp('> \\[!annotation\\]\\n> %%\\n> ```annotation\\-json\\n> (?<annotationJson>(.|\\n)*?)\\n> ```\\n> %%\\n> \\n> (?<tags>(.|\\n)*?)\\n> \\n> \\*"(?<highlight>(.|\\n)*?)"\\*\\n> \\n> (?<comment>(.|\\n)*?)\\n> \\n> → \\[\\[#\\^(?<link>(.|\\n)*?)\\|Source\\]\\]\\n','g');
}

const makeAnnotationContentRegex = () =>
    new RegExp(
        [
            '(.|\\n)*?',
            '%%\\n',
            '```annotation-json\\n',
            '(?<annotationJson>(.|\\n)*?)\\n',
            '```\\n',
            '%%(.|\\n)*?\\*',
            '(%%PREFIX%%(?<prefix>(.|\\n)*?))?',
            '(%%HIGHLIGHT%%( ==)?(?<highlight>(.|\\n)*?)(== )?)?',
            '(%%POSTFIX%%(?<postfix>(.|\\n)*?))?\\*\\n',
            '(%%LINK%%(?<link>(.|\\n)*?)\\n)?',
            '(%%COMMENT%%\\n(?<comment>(.|\\n)*?)\\n)?',
            '(%%TAGS%%\\n(?<tags>(.|\\n)*))?',
            '$'
        ].join(''),
        'g'
    );

export const getAnnotationHighlightTextData = (annotation: Annotation) => {
    let prefix = '';
    let exact = '';
    let suffix = '';
    annotation.target?.[0]?.selector?.forEach(x => {
        if (x.type == 'TextQuoteSelector') {
            prefix = x.prefix || '';
            exact = x.exact || '';
            suffix = x.suffix || '';
        }
    });
    return { prefix, exact, suffix };
};

const makeAnnotationString = (annotation: Annotation, plugin: IHasAnnotatorSettings) => {
    const { highlightHighlightedText, includePostfix, includePrefix } = plugin.settings.annotationMarkdownSettings;
    const { useCustomMarkdown, customMarkdownHighlight } = plugin.settings.customMarkdownSettings;
    const { prefix, exact, suffix } = getAnnotationHighlightTextData(annotation);

    const customMarkdownDictionary = {
        annotator_json: `${JSON.stringify(stripDefaultValues(annotation, makeDefaultAnnotationObject(annotation.id, annotation.tags)))}`,
        annotator_tags: annotation.tags.map(x => `#${x}`).join(', '),
        annotator_comment: annotation.text,
        annotator_highlightedText: exact.trim(),
        annotator_prefix: `%%PREFIX%%${prefix.trim()}`,
        annotator_postfix: `%%POSTFIX%%${suffix.trim()}`,
        annotator_link: annotation.id,
        annotator_id: `^${annotation.id}`
    };

    if (useCustomMarkdown) {
        var annotationString = customMarkdownHighlight.replace(/\b(?:annotator_json|annotator_tags|annotator_comment|annotator_highlightedText|annotator_prefix|annotator_postfix|annotator_link|annotator_id)\b/gi, matched => customMarkdownDictionary[matched]);
        return '\n'+ annotationString + '\n';

    } else {
      var annotationString =
          '%%\n```annotation-json' +
          `\n${JSON.stringify(
              stripDefaultValues(annotation, makeDefaultAnnotationObject(annotation.id, annotation.tags))
          )}` +
          '\n```\n%%\n' +
          `*${includePrefix ? `%%PREFIX%%${prefix.trim()}` : ''}%%HIGHLIGHT%%${
              highlightHighlightedText ? ' ==' : ''
          }${exact.trim()}${highlightHighlightedText ? '== ' : ''}${
              includePostfix ? `%%POSTFIX%%${suffix.trim()}` : ''
          }*\n%%LINK%%[[#^${annotation.id}|show annotation]]\n%%COMMENT%%\n${
              annotation.text || ''
          }\n%%TAGS%%\n${annotation.tags.map(x => `#${x}`).join(', ')}`;
      return (
          '\n' +
          annotationString
              .split('\n')
              .map(x => `>${x}`)
              .join('\n') +
          '\n^' +
          annotation.id +
          '\n'
      );
    }

};

export function getAnnotationFromFileContent(annotationId: string, fileContent: string, annotatorSettingsObject: IHasAnnotatorSettings): Annotation {
    const annotationRegex = makeAnnotationBlockRegex(annotationId);
    let m: RegExpExecArray;
    if ((m = annotationRegex.exec(fileContent)) !== null) {
        if (m.index === annotationRegex.lastIndex) {
            annotationRegex.lastIndex++;
        }
        const {
            groups: { annotationBlock, annotationId }
        } = m;
        return getAnnotationFromAnnotationBlock(annotationBlock, annotationId, annotatorSettingsObject);
    } else {
        return null;
    }
}

export const makeDefaultAnnotationObject = (annotationId: string, tags: string[]) => ({
    group: '__world__',
    permissions: { read: ['Obsidian User'], update: ['Obsidian User'], delete: ['Obsidian User'] },
    tags,
    text: '',
    user: 'Obsidian User',
    user_info: { display_name: 'Obsidian User' },
    hidden: false,
    target: [],
    links: {},
    flagged: false,
    id: annotationId
});

export const stripDefaultValues = (obj: Record<string, unknown>, defaultObj: Record<string, unknown>) => {
    const strippedObject: Record<string, unknown> = {};
    const toIgnore = ['group', 'permissions', 'user', 'user_info'];
    for (const key of Object.keys(obj)) {
        if (JSON.stringify(obj[key]) !== JSON.stringify(defaultObj[key]) && !toIgnore.includes(key)) {
            strippedObject[key] = obj[key];
        }
    }
    return strippedObject;
};

export function writeAnnotationToAnnotationFileString(
    annotation: Annotation,
    annotationFileString: string | null,
    annotatorSettingsObject: IHasAnnotatorSettings
): { newAnnotationFileString: string; newAnnotation: Annotation } {
    const annotationId = annotation.id ? annotation.id : Math.random().toString(36).substr(2);
    const res = JSON.parse(JSON.stringify(annotation));
    res.flagged = false;
    res.id = annotationId;
    const annotationString = makeAnnotationString(res, annotatorSettingsObject);
    if (annotationFileString !== null) {
        let didReplace = false;
        const regex = makeAnnotationBlockRegex(annotationId);
        annotationFileString = annotationFileString.replace(regex, () => {
            didReplace = true;
            return annotationString;
        });
        if (!didReplace) {
            annotationFileString = `${annotationFileString}\n${annotationString}`;
        }
        return { newAnnotationFileString: annotationFileString, newAnnotation: res };
    } else {
        return { newAnnotationFileString: annotationString, newAnnotation: res };
    }
}

export function loadAnnotationsAtUriFromFileText(url: URL | null, fileText: string | null, annotatorSettingsObject: IHasAnnotatorSettings): AnnotationList {
    const params = url ? Object.fromEntries(url.searchParams.entries()) : null;
    if (params?.uri == 'app://obsidian.md/index.html') {
        return { rows: [], total: 0 };
    }

    const rows = [];

    const annotationRegex = makeAnnotationBlockRegex();
    if (fileText !== null) {
        let m: RegExpExecArray;
        while ((m = annotationRegex.exec(fileText)) !== null) {
            if (m.index === annotationRegex.lastIndex) {
                annotationRegex.lastIndex++;
            }
            const {
                groups: { annotationBlock, annotationId }
            } = m;
            const completeAnnotation = getAnnotationFromAnnotationBlock(annotationBlock, annotationId, annotatorSettingsObject);
            const annotationDocumentIdentifiers = [
                completeAnnotation.document?.documentFingerprint,
                completeAnnotation.uri
            ];

            //The check against SAMPLE_PDF_URL is for backwards compability.
            if (
                url === null ||
                annotationDocumentIdentifiers.includes(params.uri) ||
                annotationDocumentIdentifiers.includes(encodeURI(params.uri)) ||
                annotationDocumentIdentifiers.includes(decodeURI(params.uri)) ||
                annotationDocumentIdentifiers.includes(SAMPLE_PDF_URL)
            ) {
                rows.push(completeAnnotation);
            }
        }
    }
    return { rows, total: rows.length };
}

export function deleteAnnotationFromAnnotationFileString(
    annotationId: string,
    annotationFileString: string | null
): string {
    if (annotationFileString !== null) {
        let didReplace = false;
        const regex = makeAnnotationBlockRegex(annotationId);
        annotationFileString = annotationFileString.replace(regex, () => {
            didReplace = true;
            return '';
        });
        if (didReplace) {
            return annotationFileString;
        }
    }

    return annotationFileString;
}

export function checkPseudoAnnotationEquality(annotation: Annotation, pseudoAnnotation: Annotation): boolean {
    const isPageNote = !annotation.target?.length;
    if (isPageNote) {
        return false;
    }
    const selectors = new Set(annotation.target[0].selector.map(x => JSON.stringify(x)));
    return pseudoAnnotation?.target?.[0]?.selector?.map(x => selectors.has(JSON.stringify(x))).reduce((a, b) => a || b);
}
