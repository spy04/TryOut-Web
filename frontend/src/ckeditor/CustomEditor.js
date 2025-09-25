import { useRef } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Alignment,
  Autoformat,
  AutoImage,
  Autosave,
  BalloonToolbar,
  BlockQuote,
  BlockToolbar,
  Bold,
  CloudServices,
  Code,
  Emoji,
  Essentials,
  FindAndReplace,
  FontBackgroundColor,
  FontColor,
  FontFamily,
  FontSize,
  Fullscreen,
  Heading,
  Highlight,
  HorizontalLine,
  HtmlEmbed,
  ImageBlock,
  ImageCaption,
  ImageInline,
  ImageInsert,
  ImageInsertViaUrl,
  ImageResize,
  ImageStyle,
  ImageTextAlternative,
  ImageToolbar,
  ImageUpload,
  Indent,
  IndentBlock,
  Italic,
  Link,
  LinkImage,
  List,
  ListProperties,
  Markdown,
  MediaEmbed,
  Mention,
  Paragraph,
  PasteFromMarkdownExperimental,
  PasteFromOffice,
  PlainTableOutput,
  ShowBlocks,
  SimpleUploadAdapter,
  SourceEditing,
  SpecialCharacters,
  SpecialCharactersArrows,
  SpecialCharactersCurrency,
  SpecialCharactersEssentials,
  SpecialCharactersLatin,
  SpecialCharactersMathematical,
  SpecialCharactersText,
  Strikethrough,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableLayout,
  TableProperties,
  TableToolbar,
  TextTransformation,
  TodoList,
  Underline
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';
import './ckeditor.css';

const LICENSE_KEY = 'GPL'; // atau ganti dengan license key kalau ada

export default function CustomEditor({ initialData = '', onChange, config = {} }) {
  const editorContainerRef = useRef(null);

  // Default config yang lengkap
  const defaultConfig = {
    toolbar: {
      items: [
        'undo', 'redo', '|',
        'sourceEditing', 'showBlocks', '|',
        'heading', '|',
        'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|',
        'bold', 'italic', 'underline', '|',
        'link', 'insertImage', 'insertTable', 'insertTableLayout',
        'highlight', 'blockQuote', '|',
        'alignment', '|',
        'bulletedList', 'numberedList', 'todoList', 'outdent', 'indent'
      ],
      shouldNotGroupWhenFull: false
    },
    plugins: [
      Alignment, Autoformat, AutoImage, Autosave, BalloonToolbar, BlockQuote,
      BlockToolbar, Bold, CloudServices, Code, Emoji, Essentials, FindAndReplace,
      FontBackgroundColor, FontColor, FontFamily, FontSize, Fullscreen, Heading,
      Highlight, HorizontalLine, HtmlEmbed, ImageBlock, ImageCaption, ImageInline,
      ImageInsert, ImageInsertViaUrl, ImageResize, ImageStyle, ImageTextAlternative,
      ImageToolbar, ImageUpload, Indent, IndentBlock, Italic, Link, LinkImage, List,
      ListProperties, Markdown, MediaEmbed, Mention, Paragraph,
      PasteFromMarkdownExperimental, PasteFromOffice, PlainTableOutput, ShowBlocks,
      SimpleUploadAdapter, SourceEditing, SpecialCharacters, SpecialCharactersArrows,
      SpecialCharactersCurrency, SpecialCharactersEssentials, SpecialCharactersLatin,
      SpecialCharactersMathematical, SpecialCharactersText, Strikethrough, Table,
      TableCaption, TableCellProperties, TableColumnResize, TableLayout, TableProperties,
      TableToolbar, TextTransformation, TodoList, Underline
    ],
    balloonToolbar: ['bold', 'italic', '|', 'link', 'insertImage', '|', 'bulletedList', 'numberedList'],
    blockToolbar: [
      'fontSize', 'fontColor', 'fontBackgroundColor', '|',
      'bold', 'italic', '|',
      'link', 'insertImage', 'insertTable', 'insertTableLayout', '|',
      'bulletedList', 'numberedList', 'outdent', 'indent'
    ],
    fontFamily: { supportAllValues: true },
    fontSize: { options: [10, 12, 14, 'default', 18, 20, 22], supportAllValues: true },
    fullscreen: {
      onEnterCallback: container =>
        container.classList.add(
          'editor-container',
          'editor-container_classic-editor',
          'editor-container_include-block-toolbar',
          'editor-container_include-fullscreen',
          'main-container'
        )
    },
    heading: {
      options: [
        { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
        { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
        { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
        { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
        { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
        { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
        { model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' }
      ]
    },
    image: {
      toolbar: ['toggleImageCaption','imageTextAlternative','|','imageStyle:inline','imageStyle:wrapText','imageStyle:breakText','|','resizeImage']
    },
    placeholder: 'Type or paste your content here!',
    licenseKey: LICENSE_KEY
  };

  // Merge defaultConfig sama config dari parent
  const mergedConfig = { ...defaultConfig, ...config };

  return (
    <div
      className="editor-container editor-container_classic-editor editor-container_include-block-toolbar editor-container_include-fullscreen"
      ref={editorContainerRef}
    >
      <CKEditor
        editor={ClassicEditor}
        data={initialData}
        config={mergedConfig}
        onChange={(event, editor) => {
          if (onChange) onChange(editor.getData(), editor);
        }}
      />
    </div>
  );
}
