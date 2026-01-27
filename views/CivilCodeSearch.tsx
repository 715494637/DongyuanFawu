
import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Bookmark } from 'lucide-react';
import { cachedApi } from '../services/apiService';
import { LawArticle } from '../types';

const CivilCodeSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<LawArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        // 使用带缓存的 API（法条数据变化少，30分钟缓存）
        const data = await cachedApi.getCivilCode();
        setArticles(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('获取民法典条文失败:', err);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);
  
  const filtered = articles.filter(a => 
    a.title.includes(query) || a.content.includes(query)
  );

  return (
    <div className="p-6 pb-24 space-y-6 animate-fade-in bg-slate-50 min-h-full">
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Search size={20} /></div>
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索条款关键词，如：物业费"
          className="w-full bg-white border border-gray-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:ring-4 focus:ring-purple-500/5 focus:border-purple-500/20 shadow-sm transition-all"
        />
      </div>

      <div className="space-y-4">
        {filtered.map(art => (
          <div key={art.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <BookOpen size={48} />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
              <span className="text-xs font-black text-purple-600 uppercase tracking-widest">{art.title}</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed font-medium">
              {art.content}
            </p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-20 text-center text-gray-300">
             <Bookmark size={48} className="mx-auto mb-4 opacity-10" />
             <p className="text-xs font-bold uppercase tracking-widest">未检索到相关条款</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CivilCodeSearch;
