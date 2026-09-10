// Dữ liệu Kỹ năng PCTT — sinh tự động từ Backend/scripts/build-pctt-skills-data.js
// (ảnh: Cloudinary folder pctt-skills/<id>; video: Backend/media/pctt-videos/<id>/,
// phục vụ qua ${API_BASE_URL}/media/... trên VPS). Nội dung tĩnh, cập nhật bằng
// cách chạy lại script trên, không sửa tay file này.
const PCTT_SKILLS = [
  {
    "id": "01",
    "label": "Bão, ANTĐ",
    "icon": "🌀",
    "videos": [
      {
        "title": "Những việc cần làm sau bão",
        "path": "/media/pctt-videos/01/nhung-viec-can-lam-sau-bao.mp4"
      },
      {
        "title": "Hướng dẫn đảm bảo an toàn trước và trong bão",
        "path": "/media/pctt-videos/01/huong-dan-dam-bao-an-toan-truoc-va-trong-bao.mp4"
      },
      {
        "title": "Hướng dẫn gia cố bảo vệ ao, đầm, lồng bè",
        "path": "/media/pctt-videos/01/huong-dan-gia-co-bao-ve-ao-dam-long-be.mp4"
      }
    ],
    "images": [
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239333/pctt-skills/01/hi2mhjout8wltehnnrlm.jpg",
        "caption": "Cấp gió và mức nguy hại của ATNĐ-Bão"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239334/pctt-skills/01/dsghxd4wuun8yca4g491.jpg",
        "caption": "Đảm bảo an toàn tàu thuyền khi có ATNĐ Bão"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239335/pctt-skills/01/s79mevehr2oh2wkeiunk.jpg",
        "caption": "Hướng dẫn neo đậu tàu thuyền tránh trú bão"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239336/pctt-skills/01/daid8k742hhg10k0rwel.jpg",
        "caption": "HD gia cố bảo vệ ao đầm lồng bè thủy sản trước bão"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239337/pctt-skills/01/ccuq1aey8wm83nhsovou.jpg",
        "caption": "HD đảm bảo an toàn trước, trong ATNĐ Bão cho ngư dân"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239338/pctt-skills/01/jsjjhiipqvgpjooau0p0.jpg",
        "caption": "HD an toàn trước khi bão đổ bộ cho dân cư đất liền"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239339/pctt-skills/01/sn7mzg1q0x3jtmfvdv7m.jpg",
        "caption": "HD an toàn khi bão đổ bộ cho dân cư đất liền"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239340/pctt-skills/01/am5glphfmg4algei4uyt.jpg",
        "caption": "Những việc cần làm sau bão"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239342/pctt-skills/01/bgpjjqtwyjbeiqjnninr.jpg",
        "caption": "HD an toàn cho trẻ em khi có bão"
      }
    ]
  },
  {
    "id": "02",
    "label": "Lũ",
    "icon": "🌊",
    "videos": [
      {
        "title": "Những việc cần làm trước lũ, ngập lụt",
        "path": "/media/pctt-videos/02/nhung-viec-can-lam-truoc-lu-ngap-lut.mp4"
      },
      {
        "title": "Những việc nên và không nên làm khi xảy ra lũ, ngập lụt",
        "path": "/media/pctt-videos/02/nhung-viec-nen-va-khong-nen-lam-khi-xay-ra-lu.mp4"
      },
      {
        "title": "Đảm bảo an toàn khi hồ thủy điện vận hành xả lũ",
        "path": "/media/pctt-videos/02/dam-bao-an-toan-khi-ho-thuy-dien-van-hanh-xa-lu.mp4"
      },
      {
        "title": "Vệ sinh môi trường và phòng tránh dịch bệnh sau mưa lũ",
        "path": "/media/pctt-videos/02/ve-sinh-moi-truong-va-phong-tranh-dich-benh-sau-mua-lu.mp4"
      },
      {
        "title": "Kỹ năng an toàn, phòng tránh đuối nước cho trẻ em",
        "path": "/media/pctt-videos/02/ky-nang-an-toan-phong-tranh-duoi-nuoc-cho-tre-em.mp4"
      }
    ],
    "images": [
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239343/pctt-skills/02/qm4vr50indnrhmf0fyvh.jpg",
        "caption": "Những việc cần làm trước lũ"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239344/pctt-skills/02/nz8lgmmbt3xsr5duuqkg.jpg",
        "caption": "HD kxy năng an toàn trong và sau lũ"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239346/pctt-skills/02/mbhbkyaugo8mn0igsvhw.jpg",
        "caption": "Đảm bảo an toàn khi hồ thủy điện vận hành xả lũ"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239347/pctt-skills/02/qdr3ur2ftbhqd6iabfal.jpg",
        "caption": "Hướng dẫn đảm bảo an toàn vùng lũ ngập sâu, nước dâng nhanh"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239348/pctt-skills/02/sgkrkalkdpxkumtpwwdq.jpg",
        "caption": "Vệ sinh MT, phòng tránh dịch bệnh sau mua lũ"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239349/pctt-skills/02/agkuosbtdxo5m3knngda.jpg",
        "caption": "Kỹ năng AT phòng tránh đuối nước cho trẻ em"
      }
    ]
  },
  {
    "id": "03",
    "label": "Ngập lụt",
    "icon": "💧",
    "videos": [],
    "images": [
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239350/pctt-skills/03/wuzbecwleuvmffqsskmr.jpg",
        "caption": "Ngập lụt nguyên tắc phòng tránh"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239351/pctt-skills/03/ugf5ni7oyyxcskiq4wjv.jpg",
        "caption": "HD đảm bảo an toàn khi có ngập lụt đô thị"
      }
    ]
  },
  {
    "id": "04",
    "label": "Mưa lớn",
    "icon": "🌧️",
    "videos": [],
    "images": [
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239352/pctt-skills/04/yofbzbnz9w8aiv2asexc.jpg",
        "caption": "Mưa lớn nguyên tắc phòng tránh"
      }
    ]
  },
  {
    "id": "05",
    "label": "Lũ quét",
    "icon": "🌊",
    "videos": [
      {
        "title": "Lũ quét - dấu hiệu nhận biết và nguyên tắc phòng tránh",
        "path": "/media/pctt-videos/05/lu-quet-dau-hieu-nhan-biet-va-nguyen-tac-phong-tranh.mp4"
      },
      {
        "title": "Lũ quét - những việc nên làm để đảm bảo an toàn",
        "path": "/media/pctt-videos/05/lu-quet-nhung-viec-nen-lam-de-dam-bao-an-toan.mp4"
      },
      {
        "title": "Lũ quét - những việc không nên làm để đảm bảo an toàn",
        "path": "/media/pctt-videos/05/lu-quet-nhung-viec-khong-nen-lam-de-dam-bao-an-toan.mp4"
      },
      {
        "title": "Lũ quét - hướng dẫn đảm bảo an toàn cho trẻ em",
        "path": "/media/pctt-videos/05/lu-quet-huong-dan-dam-bao-an-toan-cho-tre-em.mp4"
      }
    ],
    "images": [
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239353/pctt-skills/05/kierbormpxq9gzxoe5l7.jpg",
        "caption": "Nguyên nhân dấu hiệu nhận biết lũ quét"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239354/pctt-skills/05/xqaesycj4zhgxi0u1f3c.jpg",
        "caption": "Những việc nên làm để an toàn khi có lũ quét"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239355/pctt-skills/05/e07uieddy0q9neu3rhbv.jpg",
        "caption": "Những việc ko nên làm để an toàn khi có lũ quét"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239356/pctt-skills/05/gbs2u8kkjtvp61bwbuy5.jpg",
        "caption": "Chúng mình phải làm gì để an toàn khi có lũ quét"
      }
    ]
  },
  {
    "id": "06",
    "label": "Sạt lở đất",
    "icon": "⛰️",
    "videos": [
      {
        "title": "Những việc không nên làm để ứng phó với sạt lở đất",
        "path": "/media/pctt-videos/06/nhung-viec-khong-nen-lam-de-ung-pho-voi-sat-lo-dat.mp4"
      }
    ],
    "images": [
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239357/pctt-skills/06/tkb2axzeqemsaojbqgho.jpg",
        "caption": "Nguyên nhân dâu hiệu nhận biết sạt lở đất"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239359/pctt-skills/06/h7nwcg7mtnmbtjacfhva.jpg",
        "caption": "Sạt lở đất những việc nên làm để đảm bảo an toàn"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239360/pctt-skills/06/rpnbjzvearyylkfpyu8m.jpg",
        "caption": "Sạt lở đất những việc ko nên làm để đảm bảo an toàn"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239361/pctt-skills/06/tlabpczqjsmmwobo0hsp.jpg",
        "caption": "Chúng mình phải làm gì để đảm bảo AT khi có sạt lở đất"
      }
    ]
  },
  {
    "id": "07",
    "label": "Lốc",
    "icon": "🌪️",
    "videos": [],
    "images": [
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239362/pctt-skills/07/xbzhwv2lfljj7ajythfc.jpg",
        "caption": "Nguyên tắc phòng tránh dông lốc"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239364/pctt-skills/07/j5tpfqittiwev1occtsz.jpg",
        "caption": "HD đảm bảo an toàn khi có lốc xoáy"
      }
    ]
  },
  {
    "id": "08",
    "label": "Mưa đá",
    "icon": "🧊",
    "videos": [],
    "images": [
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239365/pctt-skills/08/y7sqhpuya6wc9zomrrbe.jpg",
        "caption": "Mưa đá, dấu hiệu nhận biết"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239366/pctt-skills/08/bwqmy6sjshzsfqfabi5m.jpg",
        "caption": "Những việc nên và ko nên làm khi có mưa đá"
      }
    ]
  },
  {
    "id": "09",
    "label": "Nắng nóng",
    "icon": "☀️",
    "videos": [],
    "images": [
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239367/pctt-skills/09/wtadpahgqxlg9zocgvll.jpg",
        "caption": "Khuyến cáo phòng bệnh khi có nắng nóng"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239368/pctt-skills/09/cwr8jsy5xjtjnuidxqi8.jpg",
        "caption": "Những điều cần lưu ý khi du lịch mùa nắng nóng"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239369/pctt-skills/09/vezjxdoh7ph0iuuzjmdy.jpg",
        "caption": "Những biện pháp cần làm khi có nắng nóng"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239370/pctt-skills/09/zsmyqthuorgjtbsqtu8o.jpg",
        "caption": "Bảo vệ cây trồng vật nuôi khi có nắng nóng"
      }
    ]
  },
  {
    "id": "10",
    "label": "Xâm nhập mặn",
    "icon": "🧂",
    "videos": [],
    "images": [
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239371/pctt-skills/10/v7w5qqogbrsdwzl3i2ey.jpg",
        "caption": "Xâm nhập mặn, tác hại và biện pháp bảo vệ nguồn nước"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239372/pctt-skills/10/z4qgdosljkai7f5fyqh4.jpg",
        "caption": "Những việc cần làm ứng phso vơi XNM"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239374/pctt-skills/10/s8wzozhmjmvmfrpiwqla.jpg",
        "caption": "Giải pháp chống xâm nhập mặn cây trồng vật nuôi"
      }
    ]
  },
  {
    "id": "11",
    "label": "Hạn hán",
    "icon": "🏜️",
    "videos": [],
    "images": [
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239375/pctt-skills/11/vatv4maocsiqjp9b9hlk.jpg",
        "caption": "Hạn hán là gì, nguyên nhân tác hại và bp ứng phó"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239376/pctt-skills/11/vfpq6zjqtfj7hrijkqom.jpg",
        "caption": "Những việc cần làm ứng phó với hạn hán"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239377/pctt-skills/11/viqlgfr410lartjdaqrp.jpg",
        "caption": "Biện pháp giảm thiểu thiệt hại cho cây trồng, vật nuôi"
      }
    ]
  },
  {
    "id": "12",
    "label": "Rét hại",
    "icon": "🥶",
    "videos": [],
    "images": [
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239379/pctt-skills/12/i4k6vaw8je2jwniajfx1.jpg",
        "caption": "Cách giữ ấm trong những ngày rét đậm, rét hại"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239380/pctt-skills/12/ltnubib23vtfk5wnsykh.jpg",
        "caption": "Những lưu ý khi đi du lịch mùa đông"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239381/pctt-skills/12/hduzginss2vuntgtt7ls.jpg",
        "caption": "Những điều cần biết để phòng tránh rét hại"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239382/pctt-skills/12/q6yu5vhcub2u77fx5shv.jpg",
        "caption": "Cách phòng chống rét đậm, rét hại cho cây trồng"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239383/pctt-skills/12/uey3yfqfeaa0i3dtithi.jpg",
        "caption": "Cách phòng chống rét đậm, rét hại cho vật nuôi"
      }
    ]
  },
  {
    "id": "13",
    "label": "Sét",
    "icon": "⚡",
    "videos": [
      {
        "title": "Sét và các biện pháp phòng tránh sét",
        "path": "/media/pctt-videos/13/set-va-cac-bien-phap-phong-tranh-set.mp4"
      }
    ],
    "images": [
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239385/pctt-skills/13/wz4g05g48tfhjejejpvs.jpg",
        "caption": "Sét là gì, nguyên nhân hình thành, dấu hiệu nhận biết"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239386/pctt-skills/13/th8x3b16npch2tmav8fl.jpg",
        "caption": "Các biện pháp phòng chống sét"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239387/pctt-skills/13/zssyahswragk8ms8aib1.jpg",
        "caption": "Cách sơ cứu nạn nhân bị sét đánh"
      }
    ]
  },
  {
    "id": "14",
    "label": "Động đất",
    "icon": "🌍",
    "videos": [],
    "images": [
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239388/pctt-skills/14/vtqdywilsuui1y6nvuwk.jpg",
        "caption": "HD kỹ năng ứng phó với động đất, nguyên nhân, dấu hiệu nhận biết"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239389/pctt-skills/14/c9scdq191qzpqi41gl8g.jpg",
        "caption": "Hướng dẫn đảm bảo an toàn khi có động đất"
      },
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239390/pctt-skills/14/snfg6mpzqhfkbnhy0sze.jpg",
        "caption": "Hướng dẫn đảm bảo an toàn sau khi có động đất"
      }
    ]
  },
  {
    "id": "15",
    "label": "Sóng thần",
    "icon": "🌊",
    "videos": [],
    "images": [
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239392/pctt-skills/15/bei1bj51p3oimp7vkels.jpg",
        "caption": "Hướng dẫn đảm bảo an toàn khi có sóng thần"
      }
    ]
  },
  {
    "id": "16",
    "label": "Gió mạnh trên biển",
    "icon": "💨",
    "videos": [],
    "images": [
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239393/pctt-skills/16/uxpkhuxeb1dkue5uokjx.jpg",
        "caption": "Hướng dẫn ứng phó với gió mạnh trên biển"
      }
    ]
  },
  {
    "id": "17",
    "label": "Sương muối",
    "icon": "❄️",
    "videos": [],
    "images": [
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239394/pctt-skills/17/jkjovjbrqrdvcecntaoa.jpg",
        "caption": "Suong muoi, cách bảo vệ cây trồng, vật nuôi"
      }
    ]
  },
  {
    "id": "18",
    "label": "Sương mù",
    "icon": "🌫️",
    "videos": [],
    "images": [
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239395/pctt-skills/18/bo7nwtweh6qvnwf9nlhd.jpg",
        "caption": "HD an toàn giao thông khi có sương mù"
      }
    ]
  },
  {
    "id": "19",
    "label": "Cháy rừng",
    "icon": "🔥",
    "videos": [],
    "images": [
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239396/pctt-skills/19/en90erb6x0ohcr0gvo84.jpg",
        "caption": "Các biên pháp phòng chống cháy rừng"
      }
    ]
  },
  {
    "id": "20",
    "label": "Ô nhiễm KK",
    "icon": "😷",
    "videos": [],
    "images": [
      {
        "url": "https://res.cloudinary.com/dnmz1rjbe/image/upload/v1785239399/pctt-skills/20/xuk4wnn9jplohrjyrlvu.jpg",
        "caption": "Ô nhiễm không khí và biện pháp ứng phó"
      }
    ]
  }
];

export default PCTT_SKILLS;
