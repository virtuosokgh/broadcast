import { useState, useMemo } from 'react';
import './TVSchedule.css';

const TVSchedule = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const channels = [
    // 지상파
    {
      name: 'KBS',
      logo: '📺',
      scheduleUrl: 'https://schedule.kbs.co.kr/',
      color: '#00A8E6',
      category: '지상파'
    },
    {
      name: 'MBC',
      logo: '📺',
      scheduleUrl: 'https://schedule.imbc.com/',
      color: '#FF6B00',
      category: '지상파'
    },
    {
      name: 'SBS',
      logo: '📺',
      scheduleUrl: 'https://www.sbs.co.kr/m/schedule/index.html',
      color: '#0C4DA2',
      category: '지상파'
    },
    {
      name: 'EBS',
      logo: '📺',
      scheduleUrl: 'https://www.ebs.co.kr/schedule',
      color: '#00A8E6',
      category: '지상파'
    },
    {
      name: 'OBS',
      logo: '📺',
      scheduleUrl: 'https://www.obs.co.kr/schedule/',
      color: '#00A8E6',
      category: '지상파'
    },
    
    // 종합편성
    {
      name: 'JTBC',
      logo: '📺',
      scheduleUrl: 'https://jtbc.co.kr/schedule',
      color: '#FF0000',
      category: '종합편성'
    },
    {
      name: 'JTBC2',
      logo: '📺',
      scheduleUrl: 'https://m.jtbc.co.kr/schedule/jtbc2?site_preference=normal',
      color: '#FF0000',
      category: '종합편성'
    },
    {
      name: 'JTBC4',
      logo: '📺',
      scheduleUrl: 'https://m.jtbc.co.kr/schedule/jtbc4?site_preference=normal',
      color: '#FF0000',
      category: '종합편성'
    },
    {
      name: 'MBN',
      logo: '📺',
      scheduleUrl: 'https://m.mbn.co.kr/tvguide/main.mbn',
      color: '#FF6B00',
      category: '종합편성'
    },
    {
      name: '채널A',
      logo: '📺',
      scheduleUrl: 'https://ichannela.com/com/cmm/schedule.do',
      color: '#FF6B00',
      category: '종합편성'
    },
    {
      name: 'TV조선',
      logo: '📺',
      scheduleUrl: 'https://broadcast.tvchosun.com/onair/schedule/today.cstv',
      color: '#FF0000',
      category: '종합편성'
    },
    
    // tvN 계열
    {
      name: 'tvN',
      logo: '📺',
      scheduleUrl: 'https://tvn.cjenm.com/ko/tvn-schedule/',
      color: '#C8171D',
      category: 'CJ ENM'
    },
    {
      name: 'tvN STORY',
      logo: '📺',
      scheduleUrl: 'https://tvn.cjenm.com/ko/tvn-story-schedule/',
      color: '#C8171D',
      category: 'CJ ENM'
    },
    {
      name: 'tvN DRAMA',
      logo: '📺',
      scheduleUrl: 'https://tvn.cjenm.com/ko/tvn-drama-schedule/',
      color: '#C8171D',
      category: 'CJ ENM'
    },
    {
      name: 'tvN SHOW',
      logo: '📺',
      scheduleUrl: 'https://tvn.cjenm.com/ko/tvn-show-schedule/',
      color: '#C8171D',
      category: 'CJ ENM'
    },
    
    // OCN 계열
    {
      name: 'OCN',
      logo: '📺',
      scheduleUrl: 'https://ocn.cjenm.com/ko/ocn-schedule/',
      color: '#000000',
      category: 'CJ ENM'
    },
    {
      name: 'OCN Movies',
      logo: '📺',
      scheduleUrl: 'https://ocn.cjenm.com/ko/ocn_movies-schedule/',
      color: '#000000',
      category: 'CJ ENM'
    },
    {
      name: 'OCN Movies2',
      logo: '📺',
      scheduleUrl: 'https://ocn.cjenm.com/ko/ocn-movies2-schedule/',
      color: '#000000',
      category: 'CJ ENM'
    },
    {
      name: '투니버스',
      logo: '📺',
      scheduleUrl: 'https://tooniverse.cjenm.com/ko/schedule/',
      color: '#FFD700',
      category: 'CJ ENM'
    },
    
    // SBS 계열
    {
      name: 'SBS Plus',
      logo: '📺',
      scheduleUrl: 'https://www.sbs.co.kr/m/schedule/index.html?channel=Plus&type=tv',
      color: '#0C4DA2',
      category: 'SBS 계열'
    },
    {
      name: 'SBS funE',
      logo: '📺',
      scheduleUrl: 'https://www.sbs.co.kr/m/schedule/index.html?channel=ETV&type=tv',
      color: '#0C4DA2',
      category: 'SBS 계열'
    },
    {
      name: 'SBS Sports',
      logo: '📺',
      scheduleUrl: 'https://www.sbs.co.kr/m/schedule/index.html?channel=ESPN&pmDate=&type=tv',
      color: '#0C4DA2',
      category: 'SBS 계열'
    },
    {
      name: 'SBS Golf',
      logo: '📺',
      scheduleUrl: 'https://golf.sbs.co.kr/m/schedule',
      color: '#0C4DA2',
      category: 'SBS 계열'
    },
    {
      name: 'SBS Biz',
      logo: '📺',
      scheduleUrl: 'https://www.sbs.co.kr/m/schedule/index.html?channel=sbsBiz&type=tv',
      color: '#0C4DA2',
      category: 'SBS 계열'
    },
    
    // ENA 계열
    {
      name: 'ENA',
      logo: '📺',
      scheduleUrl: 'https://ktena.co.kr/schedule/',
      color: '#00D9FF',
      category: 'ENA 계열'
    },
    {
      name: 'ENA ONCE',
      logo: '📺',
      scheduleUrl: 'https://ktena.co.kr/schedule/?c=ONCE',
      color: '#00D9FF',
      category: 'ENA 계열'
    },
    
    // KBS N 계열
    {
      name: 'KBS N',
      logo: '📺',
      scheduleUrl: 'https://www.kbsn.co.kr/schedule/',
      color: '#00A8E6',
      category: 'KBS N 계열'
    },
    {
      name: 'KBS JOY',
      logo: '📺',
      scheduleUrl: 'https://www.kbsn.co.kr/schedule/?ch=JOY&dt=',
      color: '#00A8E6',
      category: 'KBS N 계열'
    },
    {
      name: 'KBSN SPORTS',
      logo: '📺',
      scheduleUrl: 'https://www.kbsn.co.kr/schedule/?ch=SPORTS',
      color: '#00A8E6',
      category: 'KBS N 계열'
    },
    
    // MBC 계열
    {
      name: 'MBC every1',
      logo: '📺',
      scheduleUrl: 'https://m.imbc.com/schedule/every1',
      color: '#FF6B00',
      category: 'MBC 계열'
    },
    {
      name: 'MBC Plus',
      logo: '📺',
      scheduleUrl: 'https://www.mbcplus.com/web/schedule/list.do',
      color: '#FF6B00',
      category: 'MBC 계열'
    },
    
    // 뉴스 채널
    {
      name: '연합뉴스TV',
      logo: '📺',
      scheduleUrl: 'https://www.yonhapnewstv.co.kr/live/schedule',
      color: '#FF0000',
      category: '뉴스'
    },
    {
      name: 'YTN',
      logo: '📺',
      scheduleUrl: 'https://m.ytn.co.kr/schedule.php',
      color: '#FF0000',
      category: '뉴스'
    },
    
    // 스포츠 채널
    {
      name: 'SPOTV',
      logo: '📺',
      scheduleUrl: 'https://www.spotv.net/schedule/schedule_01.asp',
      color: '#FF6B00',
      category: '스포츠'
    },
    
    // 공공 채널
    {
      name: 'KTV',
      logo: '📺',
      scheduleUrl: 'https://m.ktv.go.kr/onair/schedule',
      color: '#00A8E6',
      category: '공공'
    }
  ];

  const handleChannelClick = (channel) => {
    window.open(channel.scheduleUrl, '_blank', 'noopener,noreferrer');
  };

  // 검색 필터링
  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) {
      return channels;
    }
    const query = searchQuery.toLowerCase().trim();
    return channels.filter(channel => 
      channel.name.toLowerCase().includes(query) ||
      (channel.category && channel.category.toLowerCase().includes(query))
    );
  }, [searchQuery, channels]);

  // 카테고리별로 그룹화
  const groupedChannels = useMemo(() => {
    return filteredChannels.reduce((acc, channel) => {
      const category = channel.category || '기타';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(channel);
      return acc;
    }, {});
  }, [filteredChannels]);

  const categoryOrder = ['지상파', '종합편성', 'CJ ENM', 'SBS 계열', 'ENA 계열', 'KBS N 계열', 'MBC 계열', '뉴스', '스포츠', '공공', '기타'];

  return (
    <div className="tv-schedule-container">
      <header className="schedule-header">
        <h1>📺 TV 편성표 링크</h1>
        <p className="subtitle">각 방송사 편성표를 확인하세요</p>
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="방송국 이름으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="검색 초기화"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="search-result-count">
            {filteredChannels.length}개의 방송국이 검색되었습니다
          </p>
        )}
      </header>

      {categoryOrder.map(category => {
        if (!groupedChannels[category]) return null;
        return (
          <div key={category} className="category-section">
            <h2 className="category-title">{category}</h2>
            <div className="channels-grid">
              {groupedChannels[category].map((channel, index) => (
                <div
                  key={index}
                  className="channel-card"
                  style={{ '--channel-color': channel.color }}
                  onClick={() => handleChannelClick(channel)}
                >
                  <div className="channel-logo">{channel.logo}</div>
                  <div className="channel-name">{channel.name}</div>
                  <div className="channel-button">편성표 보기 →</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <footer className="schedule-footer">
        <p>각 방송사 편성표는 새 창에서 열립니다</p>
      </footer>
    </div>
  );
};

export default TVSchedule;
