/* ==========================================================
   《根在侨乡 · 博物馆漫游》内容数据
   ========================================================== */
(function (root) {
  'use strict';

  const IMG = (n) => 'assets/img/' + n + '.jpg';

  const MUSEUM = {
    name: '中国侨都华侨华人博物馆',
    en: 'CHINA QIAODU MUSEUM OF OVERSEAS CHINESE',
    brief: '中国侨都华侨华人博物馆位于广东江门，是国家一级博物馆，馆藏华侨文物四万余件。常设展览《根在侨乡》，以“远赴重洋—拼搏海外—融通中外—根在侨乡”为动线，讲述五邑华侨华人的百年历程。',
    brief2: '江门有“中国侨都”之称。祖籍江门的华侨华人与港澳台同胞 530 多万人，分布在全球 145 个国家和地区。一封侨批、一条铁轨、一座碉楼，都是他们留下的注脚。'
  };

  /* 世界华侨分布（map_world_clean.jpg）
     region 用于随机抽点时保证地域分散；longread 指向长文库里的一篇 */
  const WORLD_SPOTS = [
    { id: 'ca', longread: 'ca', region: '北美', x: 0.800, y: 0.140, name: '加拿大', hint: '北美北部',
      pop: '华侨华人 约 180 万', title: '加拿大 · 太平洋铁路',
      origin: '19 世纪后期，五邑人参与加拿大太平洋铁路修建；温哥华、维多利亚的唐人街由此成形。',
      text: '铁路修完，许多人留下来开洗衣店、餐馆与杂货铺，把侨乡的味道带到了北美。' },
    { id: 'us', longread: 'us', region: '北美', x: 0.850, y: 0.380, name: '美国', hint: '北美中部',
      pop: '华侨华人 约 550 万', title: '美国 · 淘金与铁路',
      origin: '1848 年加州发现金矿，1850 年代起大批五邑人赴美；1863—1869 年修建太平洋铁路，约 1.2 万名华工参与。',
      text: '最艰险的西段几乎全靠华工。他们在悬崖上吊着绳索凿石，在雪里铺轨。' },
    { id: 'cu', region: '北美', x: 0.800, y: 0.432, name: '古巴', hint: '加勒比海',
      pop: '华侨华人 约 15 万', title: '古巴 · 甘蔗园与华工',
      origin: '1847 年起，契约华工被运到古巴的甘蔗园与糖厂，哈瓦那的唐人街一度是西半球最大的华人社区之一。',
      text: '古巴独立战争中有“华人纵队”，碑上刻着“没有一个古巴华人是逃兵”。' },
    { id: 'pe', longread: 'pe', region: '南美', x: 0.860, y: 0.680, name: '秘鲁', hint: '南美西岸',
      pop: '华侨华人 约 130 万', title: '秘鲁 · 契约华工',
      origin: '19 世纪中叶，契约华工被运往秘鲁的鸟粪矿场与种植园，也把中餐与粤语带到了南美。',
      text: '利马的唐人街至今仍叫“中国城”，粤语是许多老侨的第一语言。' },
    { id: 'br', region: '南美', x: 0.898, y: 0.628, name: '巴西', hint: '南美东部',
      pop: '华侨华人 约 30 万', title: '巴西 · 茶与咖啡',
      origin: '19 世纪初，华工被招募到巴西试种茶树；此后粤籍移民在圣保罗、里约经营餐馆与批发。',
      text: '圣保罗的“二十五街”是南美最大的华人商圈。' },
    { id: 'ar', region: '南美', x: 0.892, y: 0.812, name: '阿根廷', hint: '南美南部',
      pop: '华侨华人 约 18 万', title: '阿根廷 · 超市与中餐',
      origin: '20 世纪后期，福建、广东移民在布宜诺斯艾利斯开超市、餐馆，形成华人商业区。',
      text: '一句“超市开到几点”，是许多阿根廷人对华人的第一印象。' },
    { id: 'uk', longread: 'uk', region: '欧洲', x: 0.100, y: 0.370, name: '英国', hint: '欧洲西北',
      pop: '华侨华人 约 45 万', title: '英国 · 最早的华人社区',
      origin: '19 世纪末，海员与商人定居利物浦、伦敦，形成欧洲最早的华人社区之一。',
      text: '利物浦的华人水手宿舍，是欧洲华人史最早的一页。' },
    { id: 'fr', region: '欧洲', x: 0.108, y: 0.332, name: '法国', hint: '欧洲西部',
      pop: '华侨华人 约 60 万', title: '法国 · 一战华工与十三区',
      origin: '一战期间约 14 万华工赴法；20 世纪 70 年代后，东南亚华裔难民在巴黎十三区重建唐人街。',
      text: '十三区的高楼与中餐馆，是欧洲最年轻的唐人街之一。' },
    { id: 'nl', region: '欧洲', x: 0.118, y: 0.298, name: '荷兰', hint: '欧洲西北岸',
      pop: '华侨华人 约 15 万', title: '荷兰 · 港口与餐饮',
      origin: '20 世纪初，海员与商人在鹿特丹、阿姆斯特丹落脚，中餐馆与杂货行沿港口铺开。',
      text: '荷兰的中印餐馆（印尼风味中餐）是当地华人的发明。' },
    { id: 'de', region: '欧洲', x: 0.142, y: 0.300, name: '德国', hint: '欧洲中部',
      pop: '华侨华人 约 20 万', title: '德国 · 汉堡与柏林',
      origin: '19 世纪末，汉堡港的华人水手社区初具规模；20 世纪后留学生与商人增多。',
      text: '柏林、汉堡的中餐馆与亚超，是新一代华人的落脚点。' },
    { id: 'za', longread: 'za', region: '非洲', x: 0.160, y: 0.780, name: '南非', hint: '非洲最南端',
      pop: '华侨华人 约 30 万', title: '南非 · 德兰士瓦金矿',
      origin: '1904 年起，数万华工被招募到德兰士瓦金矿，写下非洲华人史的重要一页。',
      text: '矿区的华人编号、工棚与汇款单，如今都成了侨史档案。' },
    { id: 'mu', region: '非洲', x: 0.262, y: 0.688, name: '毛里求斯', hint: '印度洋岛国',
      pop: '华人 约 3 万', title: '毛里求斯 · 非洲的华人比例之最',
      origin: '19 世纪，客家人从梅州、惠州经新加坡迁入，经营杂货与批发；首都路易港有华人街。',
      text: '春节是毛里求斯的公共假日，纸币上印着中文。' },
    { id: 'my', longread: 'my', region: '东南亚', x: 0.395, y: 0.575, name: '马来亚', hint: '东南亚半岛',
      pop: '马来西亚华人 约 700 万', title: '马来亚 · 锡矿与橡胶',
      origin: '近打谷的锡矿、橡胶园里，五邑人最集中。“琉琅妹”、怡保的侨批铺，都是南洋记忆里最熟悉的名字。',
      text: '从广海湾顺季风南下，七日至月余可达石叻、槟城。' },
    { id: 'sg', region: '东南亚', x: 0.410, y: 0.618, name: '新加坡', hint: '马六甲海峡口',
      pop: '华人 约 300 万', title: '新加坡 · 下南洋第一站',
      origin: '1819 年开埠后，粤、闽、潮移民大批涌入；五邑人多经此转往马来亚、印尼。',
      text: '牛车水、同济医院、会馆群，是早期华人社会的缩影。' },
    { id: 'th', region: '东南亚', x: 0.405, y: 0.565, name: '泰国', hint: '中南半岛',
      pop: '华人 约 900 万', title: '泰国 · 耀华力路',
      origin: '潮汕、广府移民沿湄南河进入曼谷，耀华力路（唐人街）金铺林立，粤语与潮州话至今可闻。',
      text: '泰国华人融入当地较深，许多政商家族都有华人血统。' },
    { id: 'vn', region: '东南亚', x: 0.420, y: 0.545, name: '越南', hint: '中南半岛东岸',
      pop: '华人 约 80 万', title: '越南 · 会安与堤岸',
      origin: '17 世纪起，明乡人在会安、堤岸经商；20 世纪后，粤籍移民在西贡（胡志明市）形成大商圈。',
      text: '会安的福建会馆、广肇会馆，是海上贸易的见证。' },
    { id: 'ph', region: '东南亚', x: 0.462, y: 0.578, name: '菲律宾', hint: '西太平洋群岛',
      pop: '华人 约 150 万', title: '菲律宾 · 王彬街',
      origin: '闽粤移民自宋元起就在马尼拉贸易，西班牙时期形成“八连”华人区；王彬街至今是唐人街核心。',
      text: '菲律宾华人与本地社会融合很深，许多家族姓氏已本地化。' },
    { id: 'mm', region: '东南亚', x: 0.395, y: 0.545, name: '缅甸', hint: '中南半岛西部',
      pop: '华人 约 160 万', title: '缅甸 · 仰光广东会馆',
      origin: '19 世纪，粤籍商人沿伊洛瓦底江进入仰光，经营米行、木材与杂货；广东会馆至今仍在。',
      text: '仰光唐人街的观音古庙，是粤籍移民最早建立的庙宇之一。' },
    { id: 'id', longread: 'id', region: '东南亚', x: 0.475, y: 0.625, name: '印度尼西亚', hint: '东南亚群岛',
      pop: '华侨华人 约 1000 万', title: '印度尼西亚 · 帆船贸易',
      origin: '巴达维亚（今雅加达）的华人商埠，与广东沿海的帆船贸易往来数百年。',
      text: '瓷器、茶叶、布匹换回香料与燕窝，也换回了侨批局的网络。' },
    { id: 'jp', region: '东亚', x: 0.628, y: 0.330, name: '日本', hint: '东亚岛国',
      pop: '华侨华人 约 90 万', title: '日本 · 长崎与横滨',
      origin: '17 世纪长崎的“唐馆”是早期华人聚居地；1859 年横滨开港后，广东、福建商人建立中华街。',
      text: '横滨中华街的关帝庙与妈祖庙，至今由侨团共同管理。' },
    { id: 'kr', region: '东亚', x: 0.610, y: 0.285, name: '韩国', hint: '朝鲜半岛',
      pop: '华侨华人 约 8 万', title: '韩国 · 仁川唐人街',
      origin: '1882 年《中朝商民水陆贸易章程》签订后，华商在仁川、首尔落脚，形成韩国最早的唐人街。',
      text: '仁川唐人街的炸酱面，是韩国人共同的味觉记忆。' },
    { id: 'in', region: '南亚', x: 0.382, y: 0.500, name: '印度', hint: '南亚次大陆',
      pop: '华侨华人 约 2 万', title: '印度 · 加尔各答塔坝',
      origin: '18 世纪末，粤籍客家人到加尔各答经营制革厂，塔坝（Tangra）形成华人聚居区与中餐馆群。',
      text: '塔坝的中餐馆，是印度最早的“中餐”记忆。' },
    { id: 'au', longread: 'au', region: '大洋洲', x: 0.475, y: 0.705, name: '澳大利亚', hint: '南半球大陆',
      pop: '华侨华人 约 140 万', title: '澳大利亚 · 淘金潮',
      origin: '1850 年代维多利亚金矿区的华人矿工，多来自五邑。他们修水渠、淘金，也留下了最早的华人会馆。',
      text: '本迪戈的龙博物馆，至今保存着当年矿工的神像与牌匾。' }
  ];

  /* 五邑移民路线（map_wuyi_clean.jpg） */
  const WUYI_SPOTS = [
    { id: 'nanyang', x: 0.395, y: 0.575, name: '南洋', hint: '最近的去处',
      pop: '航程 七日至月余',
      title: '南洋 · 顺季风南下',
      origin: '从广海湾、江门北街码头顺季风南下，七日至月余可达石叻（新加坡）、槟城。',
      text: '这是五邑人走得最多的一条路，也是侨批最密的一条线。' },
    { id: 'america', x: 0.850, y: 0.380, name: '美洲', hint: '跨太平洋',
      pop: '航程 二十余日',
      title: '美洲 · 横渡太平洋',
      origin: '经香港或日本，二十余日抵达旧金山。船舱拥挤，海途凶险，许多人一生只走一次。',
      text: '上岸要过移民站，护照与体检单据一样不能少。' },
    { id: 'southamerica', x: 0.860, y: 0.680, name: '南美', hint: '绕过好望角',
      pop: '航程 两三月',
      title: '南美 · 绕过好望角',
      origin: '经澳门、香港出洋，绕过好望角，航程两三个月。秘鲁、巴西的种植园与矿场是这条航线的终点。',
      text: '这条线最长，也最苦。船上的人把家书折成小块，贴身收着。' },
    { id: 'oceania', x: 0.475, y: 0.705, name: '大洋洲', hint: '南半球',
      pop: '航程 一月上下',
      title: '大洋洲 · 南下淘金',
      origin: '从香港南下，经南洋群岛至澳大利亚。淘金潮吸引了大批五邑青年。',
      text: '维多利亚金矿区的华人矿工，多来自台山、开平。' },
    { id: 'europe', x: 0.100, y: 0.370, name: '欧洲', hint: '经苏伊士运河',
      pop: '航程 月余',
      title: '欧洲 · 经苏伊士',
      origin: '多由香港上船，经苏伊士运河，月余抵达英法。海员与商人，是欧洲华人社区的起点。',
      text: '利物浦、伦敦的洗衣房与中餐馆，最早就是他们开起来的。' },
    { id: 'africa', x: 0.160, y: 0.780, name: '非洲', hint: '印度洋西行',
      pop: '航程 一月余',
      title: '非洲 · 印度洋西行',
      origin: '经印度洋西行至南非德兰士瓦金矿。1904 年前后，数万华工踏上这条路。',
      text: '金矿的华工编号，与侨批上的名字一一对应。' }
  ];

  /* 名人墙 · 老照片配对 */
  const PEOPLE = [
    { img: 'face_1', name: '戴爱莲', bio: '她把芭蕾带回中国，也把《瑶人之鼓》跳给了世界；晚年仍坚持教学，被称为“中国舞蹈之母”。', dates: '1916—2006', from: '江门 · 生于西印度群岛',
      note: '舞蹈家，中国当代舞蹈艺术先驱，被称为“中国舞蹈之母”。' },
    { img: 'face_2', name: '黄柳霜', bio: '在种族偏见最深的年代，她用自己的方式争取角色，成为好莱坞星光大道上第一位华人女星。', dates: '1905—1961', from: '台山 · 生于美国',
      note: '好莱坞首位华裔女演员，也是首位在好莱坞星光大道留星的华人。' },
    { img: 'face_3', name: '红线女', bio: '“红腔”一出，粤剧有了新的声音；她把戏台搭到南洋、北美，也把粤剧带进了电影。', dates: '1925—2013', from: '开平 · 生于广州',
      note: '粤剧表演艺术家，开创“红派”唱腔，一生演出数百出戏。' },
    { img: 'face_4', name: '李凌', bio: '战火里办音乐刊物、组织合唱，把歌声送到前线；后来主持中央乐团，推动交响乐普及。', dates: '1913—2003', from: '台山',
      note: '音乐评论家，抗战时期在多地组织抗日宣传与音乐活动。' },
    { img: 'face_5', name: '谢缵泰', bio: '《时局图》让国人第一次“看见”被瓜分的中国；他也是兴中会的重要成员。', dates: '1871—1938', from: '开平 · 生于澳大利亚',
      note: '《时局图》作者，中国近代革命活动家。' },
    { img: 'face_6', name: '李铁夫', bio: '中国油画先驱，孙中山称他“东亚画坛巨擘”；晚年把作品捐给了家乡。', dates: '1869—1952', from: '鹤山',
      note: '油画家，被誉为“中国油画之父”。' },
    { img: 'face_7', name: '司徒慧敏', bio: '左翼电影与话剧的幕后推手，参与《义勇军进行曲》的录制与传播。', dates: '1910—1987', from: '开平',
      note: '电影技术专家，延安电影团成员，新中国电影事业奠基者之一。' },
    { img: 'face_8', name: '黎民伟', bio: '“香港电影之父”，用镜头记录时代，也记录华侨的家国。', dates: '1893—1953', from: '新会',
      note: '香港电影之父，创办民新影片公司，拍摄大量纪录片。' }
  ];

  /* 广海卫城四处遗存 */
  const RUINS = [
    { id: 'wall', name: '城门及城墙', img: 'ruin_wall', cap: '摄于 1948 年',
      note: '广海卫城遗址 · 明代海防所城',
      text: '明洪武年间设广海卫，筑城御海。城墙与城门是卫城仅存的地面遗存，1948 年的影像记下了它最后的模样。',
      detail: '明洪武二十七年（1394）设广海卫，城墙周长约一千米，开四门。现仅存北门与一段城墙，是广东保存较好的明代所城遗存之一。',
      longread: 'ruin_wall' },
    { id: 'temple', name: '天后宫', img: 'ruin_temple', cap: '天后宫',
      note: '渔民航海者的信仰中心',
      text: '出海前拜天后，是侨乡人共同的仪式。一座天后宫，装着无数“平安归来”的心愿。',
      detail: '天后宫建于明代，供奉妈祖。广海人出洋前要到宫里“请香”，把香灰缝进随身布袋，称作“带香出海”。',
      longread: 'ruin_temple' },
    { id: 'tower', name: '烽火台遗址', img: 'ruin_tower', cap: '烽火台',
      note: '明代海防预警设施',
      text: '烽火台与卫城、烽堠连成海防体系。遇警举火，一夜间可传百里。',
      detail: '烽火台在卫城以东的山岗上，与卫城、烽堠构成“十里一墩”的海防预警线。遇警举火，昼烟夜火，一夜可传百里。',
      longread: 'ruin_tower' },
    { id: 'carving', name: '摩崖石刻', img: 'ruin_carving', cap: '“海永无波”',
      note: '明代平倭纪功石刻',
      text: '“海永无波”四字刻在海边的巨石上，是明代平定倭患后留下的纪功石刻，也是广海最著名的文化遗存之一。',
      detail: '“海永无波”刻于明代成化年间，为平倭将领张通纪功所书，字径近两米，至今仍立于广海海边。',
      longread: 'ruin_carving' }
  ];

  /* 五邑沿革年表 */
  const DYNASTIES = [
    { id: 'xia', dyn: '夏商周', year: '约公元前2070', note: '夏朝建立',
      desc: '五邑属南越，先民依江海而居，渔猎、采蚝、种稻；台山、新会一带出土的印纹陶与青铜器，说明这里很早就与中原有往来。' },
    { id: 'qin', dyn: '秦汉', year: '公元前214', note: '秦定岭南，设南海郡',
      desc: '公元前 214 年秦平百越，设南海郡，五邑正式纳入中原版图；汉代在此设盐官，新会、台山沿海的盐场与港口渐渐兴起。' },
    { id: 'nanbei', dyn: '南北朝', year: '420', note: '南朝宋建立',
      desc: '中原战乱，士民大批南迁，俚汉杂居；五邑山地的村落、陂塘与祠堂雏形在此时形成，佛教寺院也随南迁的僧侣传入。' },
    { id: 'suitang', dyn: '隋唐', year: '581', note: '隋朝建立',
      desc: '隋开皇十年设新会郡，唐改冈州；崖门、广海成为海上贸易口岸，瓷器、香料、稻米在此集散，为日后的“海上丝绸之路”埋下伏笔。' },
    { id: 'songyuan', dyn: '宋元', year: '960', note: '北宋建立',
      desc: '北宋设新会县，五邑人口渐增、墟市兴起；1279 年崖门海战，南宋覆亡，大批军民留居此地，五邑的乡族格局由此奠定。' },
    { id: 'mingqing', dyn: '明清', year: '1499', note: '明弘治十二年',
      desc: '明设广海卫与新宁、开平等县，卫所、墟市、宗族祠堂大兴；清中叶以后，人地矛盾加剧，邑人开始成批出洋谋生。' },
    { id: 'minguo', dyn: '民国', year: '1912', note: '中华民国成立',
      desc: '侨汇大量涌入，台山、开平的碉楼、骑楼与学校成片建起；20 世纪 30 年代侨批业达到鼎盛，侨乡的市镇面貌由此定型。' },
    { id: 'newchina', dyn: '新中国成立后', year: '1949', note: '中华人民共和国成立',
      desc: '侨乡与世界的联系逐步重建，侨批档案于 2013 年入选《世界记忆名录》；今天的五邑，仍是海外侨胞最密集的祖籍地之一。' }
  ];

  const PART1 = {
    kicker: "第 一 部 分",
    title: "远征重洋",
    en: "GOING ABROAD",
    chapter: "第一部分",
    chapterEn: "CHAPTER ONE",
    cn: "江门五邑濒临南海，是海上丝绸之路重要节点。19世纪中期，五邑地区粮食短缺，老百姓生活艰难；同时期，北美洲和大洋洲的淘金、修建铁路、农渔业开发等，急需大量劳动力，形成了内推力和外拉力，江门出现了大规模移民潮。20世纪80年代以来，江门与世界的联系更加紧密，涌现出一批勇闯世界的新生代移民。",
    eng: "Bordering the South China Sea, Jiangmen Wuyi is an important node of the Maritime Silk Road. In the mid-19th century, there was a shortage of food and social unrest in the Wuyi area. At the same time, gold mining, railway construction, and agricultural and fishery development in North America and Oceania urgently required a significant amount of labor. This formed an internal thrust and an external pull, resulting in a large-scale migration wave from Jiangmen. Since the 1980s, Jiangmen has become more closely connected with the world, and a new generation of emigrants has ventured forth into the world.",
    theme: "teal", art: "ship"
  };

  const PART2 = {
    kicker: "第 二 部 分",
    title: "拼搏海外",
    en: "WORKING OVERSEAS",
    chapter: "第二部分",
    chapterEn: "CHAPTER TWO",
    cn: "华侨在东南亚、美洲、大洋洲等地，发扬中国人的勤劳、勇敢、奉献精神，开发矿产、修筑铁路、发展农业，为世界锡都建设、美洲铁路修建、西方工业发展作出巨大贡献。",
    eng: "In Southeast Asia, the Americas, Oceania and other places, overseas Chinese have carried forward the industriousness, bravery and dedication of Chinese. They developed mining, built railways, and developed agriculture. They made important contributions to the construction of the world's tin capital, the construction of the American railway, and the development of Western industry.",
    theme: "orange", art: "rail"
  };

  const PORTAL = {
    chapter: "序厅",
    chapterEn: "PRELIMINARY HALL",
    title: "侨乡入口",
    en: "MAIN EXHIBITION ENTRANCE",
    hint: "点门里那片黑，进入「根在侨乡」展厅。",
    theme: "gold"
  };

  /* 锡矿流程 */
  const TIN = {
    title: '淘 锡',
    role: '你的身份：琉琅妹',
    intro: '“琉琅”是马来语淘洗盆的音译。东南亚锡矿的高架下，女工们用淘洗盆一遍遍冲洗矿土——她们被叫作“琉琅妹”。',
    steps: [
      { id: 'dig', title: '一 · 采掘', desc: '把矿土刨松，一担一担挑到洗矿槽边。', tip: '连续点击矿石 10 次', know: '锡矿多在山麓冲积层，矿土松软，先用锄头刨松，再挑到洗矿槽。' },
      { id: 'wash', title: '二 · 冲洗', desc: '矿土放进淘洗盆，就着流水来回晃，泥沙冲走，重的锡米留下来。', tip: '左右拖动淘洗盆，来回冲洗 6 次', know: '淘洗盆是木制的圆盆，靠水流与晃动让重的锡米沉底、轻的泥沙流走。' },
      { id: 'pick', title: '三 · 淘洗', desc: '盆底亮闪闪的就是锡米。挑出来，交到账房称重。', tip: '点出 5 颗发亮的锡米', know: '一盆矿土往往只淘出几粒锡米。锡米发亮、比重大，用手一捻就能分辨。' }
    ]
  };

  /* 铁路 */
  const RAIL = {
    terrains: [
      { id: 'plain', icon: '▤', name: '平原', need: '路基' },
      { id: 'mount', icon: '▲', name: '山岭', need: '隧道' },
      { id: 'valley', icon: '⛰', name: '深谷', need: '栈桥' },
      { id: 'river', icon: '≈', name: '河流', need: '铁桥' },
      { id: 'cliff', icon: '◣', name: '悬崖', need: '挡土墙' }
    ],
    parts: [
      { id: 'roadbed', name: '路基', desc: '夯土碎石，铺枕木' },
      { id: 'tunnel', name: '隧道', desc: '凿山而过' },
      { id: 'trestle', name: '栈桥', desc: '悬空跨谷' },
      { id: 'bridge', name: '铁桥', desc: '钢梁跨河' },
      { id: 'retaining', name: '挡土墙', desc: '石砌护坡' }
    ]
  };

  const CHINATOWN = {
    lines: [
      '转过街角，是唐人街的牌坊。',
      '左边是洗衣店，右边也是洗衣店——唐人街不大，走一圈又回到原点。'
    ],
    ending: '一天下来，你的手指被水泡得发白。账房先生按件计钱，一打衬衫两角五分。\n这些钱，一部分寄回唐山，一部分攒着，等船期。\n洗衣店的水声，是唐人街最日常的背景音。'
  };

  const LAUNDRY = {
    title: '华 昌 洗 衣 店',
    intro: '热水、搓板、炭火熨斗。一件衬衫要洗三道、烫三道。你是这家店里新来的学徒。',
    story: '旧金山的洗衣店，十有八九是华人开的。店面不大，蒸汽终日不散；前头收衣、后头熨烫，夜里还要把洗好的衬衫挂上晾绳。一份工钱，要分成房租、饭钱和寄回唐山的侨批。',
    tip: '按住熨斗，在皱褶上来回移动',
    ending: '六道皱褶都熨平了，最后一件衬衫叠好、包进纸里。\n打烊以后，老板把今天的工钱数给你，又指了指柜台上的信封：“这封批，明天托水客带回去。”\n你点点头。洗衣店的水声停了，唐人街的灯还亮着。'
  };

  const SCHOOL = {
    title: '中 华 侨 民 学 校',
    intro: '海外华文教育的课堂。今天有两节课：一节讲铁路，一节讲人。',
    less1: '第一课 · 铁路',
    less1Text: '太平洋铁路的西段，山高谷深。华工在悬崖上吊着绳索凿石，在雪里铺轨。试着开一列小车，躲开落石。',
    less2: '第二课 · 人',
    less2Text: '名人墙上，是十四位从五邑走出去的人。把他们的照片两两配对，认识他们。'
  };

  const ENDING = {
    kicker: '参 观 结 束',
    title: '根在侨乡',
    body: '你从正门进来，穿过大厅、序厅、远赴重洋、拼搏海外、融通中外，又回到了“根在侨乡”四个字下面。\n一百多年前，一群人从广海湾出发；一百多年后，他们的故事被放进这座馆里。\n看完这些，你也许明白了：所谓侨乡，是有人走出去，也总有人记着回来。',
    sign: '中国侨都华侨华人博物馆 · 云端漫游'
  };

  /* 消消乐图块 */
  const TILES = ['face_1', 'face_2', 'face_3', 'face_4', 'face_5', 'face_6'];

  root.MD = {
    IMG, MUSEUM, WORLD_SPOTS, WUYI_SPOTS, RUINS, DYNASTIES, PEOPLE,
    PART1, PART2, PORTAL, TIN, RAIL, CHINATOWN, LAUNDRY, SCHOOL, ENDING, TILES
  };
}(window));
