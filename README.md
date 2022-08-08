A modified version of [Obsidian Annotator](https://github.com/elias-sundqvist/obsidian-annotator) which is iPad compatible, and simplifies the formatting to be more "regular markdownish", and play nicer with Live Preview.

## Example
Annotations & highlights rendered in Live Preview:

![image](https://user-images.githubusercontent.com/67801159/183491710-b9564e47-93af-4539-883f-525f96fa6e7f.png)

The markdown for the top annotation:

```md
> [!annotation]
>%%
>```annotation-json
>{"created":"2022-08-08T18:40:36.890Z","text":"Interesting Quote!","updated":"2022-08-08T18:40:36.890Z","document":{"title":"untitled","link":[{"href":"urn:x-pdf:94917d2461e9ae3e90ec58cbd388fe62"},{"href":"vault:/Personal/Literature Notes/Bibliography/PDFs/Lucas2011.pdf"}],"documentFingerprint":"94917d2461e9ae3e90ec58cbd388fe62"},"uri":"vault:/Personal/Literature Notes/Bibliography/PDFs/Lucas2011.pdf","target":[{"source":"vault:/Personal/Literature Notes/Bibliography/PDFs/Lucas2011.pdf","selector":[{"type":"TextPositionSelector","start":7523,"end":7623},{"type":"TextQuoteSelector","exact":"In 2000, participants were asked to re-port the year of their first diagnosis of clinical depression","prefix":"ssant use(in the past 2 years). ","suffix":" (1996or before, 1997, 1998, 199"}]}]}
>```
>%%
> 
> #interesting
> 
> *"In 2000, participants were asked to re-port the year of their first diagnosis of clinical depression"*
> &rarr; [[#^3vf9vc0zohf|Source]]
> 
> Interesting Quote!
> 
> ^3vf9vc0zohf
```

## Usage
Specify the annotation target in the frontmatter:

```md
---
annotation-target: Lucas2011.pdf
---
```
