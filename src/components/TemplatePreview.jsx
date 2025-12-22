import React, { useMemo } from 'react';
import { Variable } from './Variable';
import { ImageIcon, ArrowUpRight, Upload, Globe, RotateCcw } from 'lucide-react';

/**
 * TemplatePreview 组件 - 负责渲染模版的预览内容，包括变量交互
 */
export const TemplatePreview = React.memo(({ 
  activeTemplate, 
  banks, 
  defaults, 
  categories, 
  activePopover, 
  setActivePopover, 
  handleSelect, 
  handleAddCustomAndSelect, 
  popoverRef, 
  t,
  displayTag,
  TAG_STYLES,
  setZoomedImage,
  fileInputRef,
  setShowImageUrlInput,
  handleResetImage
}) => {

  const parseLineWithVariables = (text, lineKeyPrefix, counters) => {
    const parts = text.split(/({{[^}]+}})/g);
    return parts.map((part, idx) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const key = part.slice(2, -2).trim();
        const varIndex = counters[key] || 0;
        counters[key] = varIndex + 1;
        
        const uniqueKey = `${key}-${varIndex}`;
        const currentValue = activeTemplate.selections[uniqueKey] || defaults[key];

        return (
          <Variable 
            key={`${lineKeyPrefix}-${idx}`}
            id={key}
            index={varIndex}
            config={banks[key]}
            currentVal={currentValue}
            isOpen={activePopover === uniqueKey}
            onToggle={(e) => {
              e.stopPropagation();
              setActivePopover(activePopover === uniqueKey ? null : uniqueKey);
            }}
            onSelect={(opt) => handleSelect(key, varIndex, opt)}
            onAddCustom={(val) => handleAddCustomAndSelect(key, varIndex, val)}
            popoverRef={popoverRef}
            categories={categories}
            t={t}
          />
        );
      }
      
      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return boldParts.map((bp, bIdx) => {
        if (bp.startsWith('**') && bp.endsWith('**')) {
          return <strong key={`${lineKeyPrefix}-${idx}-${bIdx}`} className="text-gray-900">{bp.slice(2, -2)}</strong>;
        }
        return <span key={`${lineKeyPrefix}-${idx}-${bIdx}`}>{bp}</span>;
      });
    });
  };

  const renderedContent = useMemo(() => {
    if (!activeTemplate?.content) return null;
    
    const lines = activeTemplate.content.split('\n');
    const counters = {}; 
    
    return lines.map((line, lineIdx) => {
      if (!line.trim()) return <div key={lineIdx} className="h-6"></div>;

      let content = line;
      let Type = 'div';
      let className = "text-gray-700 mb-3 leading-10";

      if (line.startsWith('### ')) {
        Type = 'h3';
        className = "text-lg font-bold text-gray-900 mt-6 mb-3 border-b border-gray-100 pb-2";
        content = line.replace('### ', '');
      } else if (line.trim().startsWith('- ')) {
        className = "ml-4 flex items-start gap-2 text-gray-700 mb-2 leading-10";
        content = (
          <React.Fragment key={lineIdx}>
            <span className="text-gray-400 mt-2.5">•</span>
            <span className="flex-1">{parseLineWithVariables(line.replace('- ', '').trim(), lineIdx, counters)}</span>
          </React.Fragment>
        );
        return <div key={lineIdx} className={className}>{content}</div>;
      } else if (/^\d+\.\s/.test(line.trim())) {
         className = "ml-4 flex items-start gap-2 text-gray-700 mb-2 leading-10";
         const number = line.trim().match(/^\d+\./)[0];
         const text = line.trim().replace(/^\d+\.\s/, '');
         content = (
            <React.Fragment key={lineIdx}>
              <span className="font-mono text-gray-400 mt-1 min-w-[20px]">{number}</span>
              <span className="flex-1">{parseLineWithVariables(text, lineIdx, counters)}</span>
            </React.Fragment>
         );
         return <div key={lineIdx} className={className}>{content}</div>;
      }

      if (typeof content === 'string') {
          return <Type key={lineIdx} className={className}>{parseLineWithVariables(content, lineIdx, counters)}</Type>;
      }
      return <Type key={lineIdx} className={className}>{content}</Type>;
    });
  }, [activeTemplate.content, activeTemplate.selections, banks, defaults, activePopover, categories, t]);

  return (
    <div className="w-full h-full relative overflow-hidden group">
        {/* Background Image Layer - Blurry Ambient Background */}
        <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700 opacity-30 blur-[60px] scale-110 pointer-events-none"
            style={{ 
                backgroundImage: activeTemplate.imageUrl ? `url(${activeTemplate.imageUrl})` : 'none',
            }}
        ></div>
        <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>

        <div className="w-full h-full overflow-y-auto px-3 py-4 md:p-8 custom-scrollbar relative z-10">
            <div 
                id="preview-card"
                className="max-w-4xl mx-auto bg-white/90 rounded-2xl md:rounded-[2rem] shadow-xl md:shadow-2xl shadow-orange-900/10 border border-white/60 p-4 sm:p-6 md:p-12 min-h-[500px] md:min-h-[600px] transition-all duration-500 relative"
            >
                {/* --- Top Section: Title & Image --- */}
                <div className="flex flex-col md:flex-row justify-between items-start mb-6 md:mb-10 relative">
                    {/* Left: Title & Meta Info */}
                    <div className="flex-1 min-w-0 pr-4 z-10 pt-2">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3 tracking-tight leading-tight">
                            {activeTemplate.name}
                        </h2>
                        {/* Tags / Meta */}
                        <div className="flex flex-wrap gap-2 mb-2">
                            <span className="px-2.5 py-1 rounded-md bg-orange-50 text-orange-600 text-xs font-bold tracking-wide border border-orange-100/50">
                                V0.5.0
                            </span>
                            {(activeTemplate.tags || []).map(tag => (
                                <span 
                                    key={tag} 
                                    className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide border ${TAG_STYLES[tag] || TAG_STYLES["default"]}`}
                                >
                                    {displayTag(tag)}
                                </span>
                            ))}
                        </div>
                        <p className="text-gray-400 text-sm font-medium mt-2">
                            靈感來源與貢獻：{activeTemplate.author || '官方'}
                        </p>
                        <p className="text-gray-400 text-sm font-medium mt-1">
                            Made by "提示詞填空器"
                        </p>
                    </div>

                    {/* Right: Image (Overhanging) */}
                    <div 
                        className="w-full md:w-auto mt-4 md:mt-0 relative md:-mr-[50px] md:-mt-[50px] z-20 flex-shrink-0"
                    >
                        <div 
                            className="bg-white p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-lg md:shadow-xl transform md:rotate-2 border border-gray-100/50 transition-all duration-300 hover:rotate-0 hover:scale-105 hover:shadow-2xl group/image w-full md:w-auto"
                        >
                            <div className={`relative overflow-hidden rounded-md md:rounded-lg bg-gray-50 flex items-center justify-center min-w-[150px] min-h-[150px] ${!activeTemplate.imageUrl ? 'w-full md:w-[300px] h-[300px]' : ''}`}>
                                {activeTemplate.imageUrl ? (
                                    <img 
                                        src={activeTemplate.imageUrl} 
                                        referrerPolicy="no-referrer"
                                        alt="Template Preview" 
                                        className="w-full md:w-auto md:max-w-[300px] md:max-h-[300px] h-auto object-contain block" 
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.style.backgroundColor = '#f1f5f9';
                                            const span = document.createElement('span');
                                            span.innerText = 'Image Failed';
                                            span.style.color = '#cbd5e1';
                                            span.style.fontSize = '12px';
                                            e.target.parentElement.appendChild(span);
                                        }}
                                    />
                                ) : (
                                    <div 
                                        className="flex flex-col items-center justify-center text-gray-300 p-4 text-center w-full h-full relative group/empty"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ImageIcon size={48} strokeWidth={1.5} className="text-gray-300" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 pointer-events-none group-hover/empty:opacity-100 group-hover/empty:pointer-events-auto transition-opacity">
                                            <div className="bg-white/95 border border-gray-200 rounded-lg shadow-lg p-3 flex flex-col gap-2 min-w-[180px]">
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="w-full px-3 py-2 text-sm text-left bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all flex items-center gap-2 justify-center"
                                                >
                                                    <ImageIcon size={16} />
                                                    {t('upload_image')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <div className={`absolute inset-0 bg-black/0 ${activeTemplate.imageUrl ? 'group-hover/image:bg-black/20' : 'group-hover/image:bg-black/5'} transition-colors duration-300 flex items-center justify-center gap-2 opacity-0 group-hover/image:opacity-100`}>
                                    {activeTemplate.imageUrl && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setZoomedImage(activeTemplate.imageUrl); }}
                                            className="p-2.5 bg-white/90 text-gray-700 rounded-full hover:bg-white hover:text-orange-600 transition-all shadow-lg"
                                            title="查看大圖"
                                        >
                                            <ArrowUpRight size={18} />
                                        </button>
                                    )}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                        className="p-2.5 bg-white/90 text-gray-700 rounded-full hover:bg-white hover:text-orange-600 transition-all shadow-lg"
                                        title="更換圖片(本地)"
                                    >
                                        <Upload size={18} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setShowImageUrlInput(true); }}
                                        className="p-2.5 bg-white/90 text-gray-700 rounded-full hover:bg-white hover:text-orange-600 transition-all shadow-lg"
                                        title="更換圖片(URL)"
                                    >
                                        <Globe size={18} />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleResetImage(); }}
                                        className="p-2.5 rounded-full bg-white/90 text-gray-700 hover:bg-white hover:text-orange-600 transition-all shadow-lg"
                                        title="恢復預設圖片"
                                    >
                                        <RotateCcw size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Rendered Content --- */}
                <div id="final-prompt-content" className="md:px-4">
                    {renderedContent}
                </div>
            </div>
        </div>
    </div>
  );
});

TemplatePreview.displayName = 'TemplatePreview';

