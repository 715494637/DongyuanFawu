import React from 'react';

// 清洗 Markdown 符号，提取纯文本内容
const cleanTextContent = (text: string): string => {
  return text
    // 移除 Markdown 链接但保留文本 [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // 移除图片链接 ![alt](url)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // 移除行内代码 `code`
    .replace(/`([^`]+)`/g, '$1')
    // 移除行间代码 ```code```
    .replace(/```[\s\S]*?```/g, '')
    // 移除 HTML 标签
    .replace(/<[^>]+>/g, '')
    // 移除水平线
    .replace(/^[-*_]{3,}$/gm, '')
    // 保留纯文本
    .trim();
};

// 检测是否是标题行 (# 标题)
const isHeading = (line: string): boolean => {
  return /^#{1,6}\s/.test(line);
};

// 检测是否是无序列表项 (* 或 - 或 + 开头)
const isUnorderedList = (line: string): boolean => {
  return /^[\s]*[-*+]\s/.test(line);
};

// 检测是否是有序列表项 (数字. 开头)
const isOrderedList = (line: string): boolean => {
  return /^[\s]*\d+[\.\)]\s/.test(line);
};

// 检测是否是引用 (> 开头)
const isQuote = (line: string): boolean => {
  return /^>\s/.test(line);
};

// 检测是否包含加粗 (**text** 或 __text__)
const hasBold = (line: string): boolean => {
  return /\*\*[^*]+\*\*|__[^_]+__/.test(line);
};

// 渲染带样式的行
const renderLine = (line: string, index: number): React.ReactNode => {
  const trimmedLine = line.trim();

  // 空行处理
  if (!trimmedLine) {
    return <div key={index} className="h-3" />;
  }

  // 标题处理 (# 到 ######)
  if (isHeading(trimmedLine)) {
    const level = (trimmedLine.match(/^#{1,6}/)?.[0].length || 1);
    const headingText = trimmedLine.replace(/^#{1,6}\s*/, '');
    const baseClasses: Record<number, string> = {
      1: 'text-xl font-bold text-gray-800 mb-3 mt-4',
      2: 'text-lg font-semibold text-gray-800 mb-2 mt-3',
      3: 'text-base font-semibold text-gray-700 mb-2 mt-2',
      4: 'text-base font-medium text-gray-700 mb-1 mt-2',
      5: 'text-sm font-medium text-gray-600 mb-1 mt-1',
      6: 'text-sm font-medium text-gray-600 mb-1 mt-1',
    };
    return (
      <p key={index} className={baseClasses[level] || baseClasses[3]}>
        {renderTextWithFormatting(headingText)}
      </p>
    );
  }

  // 无序列表处理
  if (isUnorderedList(trimmedLine)) {
    const itemText = trimmedLine.replace(/^[\s]*[-*+]\s*/, '');
    return (
      <div key={index} className="flex items-start gap-2 mb-1 ml-4">
        <span className="text-gray-400 mt-1.5">•</span>
        <span className="text-sm text-gray-700 leading-relaxed flex-1">
          {renderTextWithFormatting(itemText)}
        </span>
      </div>
    );
  }

  // 有序列表处理
  if (isOrderedList(trimmedLine)) {
    const match = trimmedLine.match(/^[\s]*(\d+)[\.\)]\s*(.*)/);
    if (match) {
      return (
        <div key={index} className="flex items-start gap-2 mb-1 ml-4">
          <span className="text-gray-500 text-sm font-medium min-w-[20px]">{match[1]}.</span>
          <span className="text-sm text-gray-700 leading-relaxed flex-1">
            {renderTextWithFormatting(match[2])}
          </span>
        </div>
      );
    }
  }

  // 引用处理
  if (isQuote(trimmedLine)) {
    const quoteText = trimmedLine.replace(/^>\s*/, '');
    return (
      <div key={index} className="border-l-4 border-gray-300 pl-3 py-1 my-2 bg-gray-50 rounded-r">
        <span className="text-sm text-gray-600 italic">
          {renderTextWithFormatting(quoteText)}
        </span>
      </div>
    );
  }

  // 普通段落处理
  return (
    <p key={index} className="text-sm text-gray-700 leading-relaxed mb-2">
      {renderTextWithFormatting(trimmedLine)}
    </p>
  );
};

// 渲染带格式的文本（加粗、斜体）
const renderTextWithFormatting = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;

  // 分割并处理 **加粗** 和 *斜体*
  const segments = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_)/g);

  segments.forEach((segment, index) => {
    if (!segment) return;

    if (segment.startsWith('**') && segment.endsWith('**')) {
      parts.push(<strong key={index} className="font-semibold text-gray-800">{segment.slice(2, -2)}</strong>);
    } else if (segment.startsWith('__') && segment.endsWith('__')) {
      parts.push(<strong key={index} className="font-semibold text-gray-800">{segment.slice(2, -2)}</strong>);
    } else if (segment.startsWith('*') && segment.endsWith('*')) {
      parts.push(<em key={index} className="italic">{segment.slice(1, -1)}</em>);
    } else if (segment.startsWith('_') && segment.endsWith('_')) {
      parts.push(<em key={index} className="italic">{segment.slice(1, -1)}</em>);
    } else {
      parts.push(segment);
    }
  });

  return parts;
};

interface SimpleMarkdownProps {
  content: string;
}

const SimpleMarkdown: React.FC<SimpleMarkdownProps> = ({ content }) => {
  if (!content) {
    return null;
  }

  // 按行分割处理
  const lines = content.split('\n');

  return (
    <div className="markdown-content">
      {lines.map((line, index) => renderLine(line, index))}
    </div>
  );
};

export { SimpleMarkdown, cleanTextContent };
export default SimpleMarkdown;
