-- Pins copied from docs/coverage/college-policy-2025-26-r1.json.
DO $repair$
DECLARE
  revision uuid;
  approved_captures constant jsonb := $captures$[
["483f4b921b77f896694ffe7bffc5faf55cc347de8d17bf3e6e03ff358e21573f","19f93b289fe6c54d5f9483afcd59fec140abf24f14305c6bd920f05b236443f1","https://api.tabroom.com/v1/rest/tourns?circuit=43&limit=100&offset=0&startAfter=2025-06-30T23:59:59Z&startBefore=2026-07-01T00:00:00Z",{"season":"tabroom-college-policy-2025-26"}],
["624a8a519babee3456e3cf9382d69be0f79a38f55b54ed211c364e01e74c1c1c","4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945","https://api.tabroom.com/v1/rest/tourns?circuit=43&limit=100&offset=41&startAfter=2025-06-30T23:59:59Z&startBefore=2026-07-01T00:00:00Z",{"season":"tabroom-college-policy-2025-26"}],
["9e8e959d4fd4f1c5ee21d425d53d4d82fce1525ab4bdb7a2145e04dfa8f3d164","78b1cb60c7ba9c1972450e377fb4d1770f952049b861037073eb1bf4f19646c7","https://api.tabroom.com/v1/rest/tourns/35973/invite",{"tournament":"35973"}],
["b53f181aa3d81246c1dff8baf7f9cb16602ae2f31c62ecd2db5271101af9965b","b4e2654f7df0be375715cbbbe3f11698586fffc65914e10d05d2fe1c736048d7","https://www.tabroom.com/api/download_data.mhtml?tourn_id=35973",{"tournament":"35973"}],
["96a7f6ba75241cfd7184a0eacea968ab6c4626d0490c88e3ec5fc71c01f37cc1","00f2f440d255edd0b52ffe496cae9dc1b81c77f26067a8039f412edda2d55b62","https://api.tabroom.com/v1/rest/tourns/36165/invite",{"tournament":"36165"}],
["7041d35afa9a92d65dbe5a83f0173c872e20027e230a7b04dd8155f41126ca58","d35d1203929fbddfda7fbffae9779410561db6976d67e508b293171cac4020e6","https://www.tabroom.com/api/download_data.mhtml?tourn_id=36165",{"tournament":"36165"}],
["d9b9f3f5b86c45d3434f700da5aa83b9230ed790e5ea2fe417538d9d6f3a0687","ff2ffe16299c36b44581aeaed2369705e3f54bd54e0b1000c3020c4faeeb8d4b","https://api.tabroom.com/v1/rest/tourns/36166/invite",{"tournament":"36166"}],
["938fc428b57764aab71e5300f875ddd300dfad939ba370faf72c3433fe4568a9","07739dd61c59f6abcd30364faf9eedafb6aa500d55956aa8d58af790dea5939d","https://www.tabroom.com/api/download_data.mhtml?tourn_id=36166",{"tournament":"36166"}],
["50e41d301c84be30fc65518629a76f2509e9db424bdc145dfc2cbfe62bcc45a3","c6d3729aacedb51f343942687f4d2812f7cb76dc942bfd2d79ec5b2879febb07","https://api.tabroom.com/v1/rest/tourns/36167/invite",{"tournament":"36167"}],
["21a01beb4219759608248b71838863920e46257219698b15ce28a40a86488180","0be58048d8f23660499546675eceac23b76445dcb686a49b718ded414b826b03","https://www.tabroom.com/api/download_data.mhtml?tourn_id=36167",{"tournament":"36167"}],
["350be2807603738af69ea91de759f28d4c2d9b6c3d8523ebb2f50f416d32e9cf","215bfbc5f034a63f7a6187b376e21d5534993448f955509f448c4c976a842ba5","https://api.tabroom.com/v1/rest/tourns/36226/invite",{"tournament":"36226"}],
["9f4ee6fc174c0846fb22d377ea89283f904dc1108a3523c57e5237c6553ea8f5","47f1b8a3a0185bcbd249cb39c36ce8190d53170cbec4e294a1df1c73a7996e83","https://www.tabroom.com/api/download_data.mhtml?tourn_id=36226",{"tournament":"36226"}],
["1a19d17d647f8c62876e0ef182de5452a9ded5d6c4e6a59f77f62dbd2468ed71","46e0340dde68635f1566bfbb92104106f85a814762fe7abd8388d64bef7babd7","https://api.tabroom.com/v1/rest/tourns/36419/invite",{"tournament":"36419"}],
["84cf2bc5c669df98315e6156c7f8b166ad4b514bdd9702500670e92833361ccc","e4f6616f19798d260a69ed5fd98a107cef8c33123c08bae688814e358c1c728a","https://www.tabroom.com/api/download_data.mhtml?tourn_id=36419",{"tournament":"36419"}],
["b1b9838a6779e5a922179800345eda44c6948469ad413c6bdc2db457825b04bf","10b918ea419124d622e4dc430da00ec8e3bfcaa2895b01d67a74346b06404033","https://api.tabroom.com/v1/rest/tourns/36431/invite",{"tournament":"36431"}],
["e95bc5295b137e733c1f35c705af4772610be3019b8229d5e44f26ae1a23ba70","f2bd5ec5088bc2a7b64feec506f488de090cc93786dd618c29a6918cf8e376bc","https://www.tabroom.com/api/download_data.mhtml?tourn_id=36431",{"tournament":"36431"}],
["15d5a534d561ab10a74dbf0a8f421537c7ff19afac469c96db44668c6bd39e10","35c3ba87262c9a0ea24bb0687826d2b06e3e02aa5b0a549e8cee5b7267f3d50c","https://api.tabroom.com/v1/rest/tourns/36610/invite",{"tournament":"36610"}],
["b60823426e7945bd2a1f776ded15b22aa86c4f484e66a03c6217ed30c90becaf","c9ece60566cf70b0e056ee7b0ace35f7fe3ae2849b2b67b4e61f3a30003645ac","https://www.tabroom.com/api/download_data.mhtml?tourn_id=36610",{"tournament":"36610"}],
["8555f13b078227463746b04fef83346235b51809c8aef97d926c7a2c8a79ac1e","2e201cef46a4198824bebae8618bd3758a4edac150353a1201416253e9913634","https://api.tabroom.com/v1/rest/tourns/36669/invite",{"tournament":"36669"}],
["14088a5b8b03618150dba943f54697b7d609902663fa9d08a16d28d56fed6141","57af6f38810e1a2650d322197823d5458736f8d3eaf664903fce8a4b78bf8cad","https://www.tabroom.com/api/download_data.mhtml?tourn_id=36669",{"tournament":"36669"}],
["a9f0dcc16dc19317e07ca8b6cd74d9b79e0d8eeee1601c22649945c59d9e0d3b","29531043dd1e1d5182bdbe214b24dcc449cd651c15b020573122a7421c353d2c","https://api.tabroom.com/v1/rest/tourns/36743/invite",{"tournament":"36743"}],
["727e3114421bf0249cb9db7964b92e26008f0db7d7dec537b300547a464fe1f6","86da1d2b90948b0f5da27d63b4bc6a1076e1c60e41d2230f5c3a7e7feb685cba","https://www.tabroom.com/api/download_data.mhtml?tourn_id=36743",{"tournament":"36743"}],
["1ae4c1dd1fad9bad4a8c5d325d62cce36423fbe927505ecb890ebf18b2d0df35","fa6a192948f7422c1a55585c0e253a9afc240beabe65cd8c73bc255b2703653e","https://api.tabroom.com/v1/rest/tourns/36816/invite",{"tournament":"36816"}],
["95322ecb1de664af82952aca14d0f2640bda4b3058c7ddc5658d60459011f768","f2b78f2901c5b63c45f0dfec3f2ed3f3dcc3ec65f56f138001bd90f74b00676b","https://www.tabroom.com/api/download_data.mhtml?tourn_id=36816",{"tournament":"36816"}],
["aee01713fc0a9bdb816f4a95a5b16d2667f98a087eec4d4e04af0440a17bda8e","fa8c6f81ba14537cdfff5947d9a96f58c44911f15c0aa3385602a940f44569bd","https://api.tabroom.com/v1/rest/tourns/36936/invite",{"tournament":"36936"}],
["fa8471a1ce3897c5da642474cb1d2afaf32ad55e20cfb61e0ce1a7c7d02671ce","3a0f97b736cdb0bd08248149f1fadeb5093c74454bc431a6a3f5615aa89af42a","https://www.tabroom.com/api/download_data.mhtml?tourn_id=36936",{"tournament":"36936"}],
["4d29f3e8c355b1546b78c8f0f0ca32e8e315baa3d645f2634bcf87f32ff9138d","9128c15157f0b3571f668ac3b2d7f4a20363aba2f23df54831a5dc0e178837c2","https://api.tabroom.com/v1/rest/tourns/37010/invite",{"tournament":"37010"}],
["810710f00f657575a30a2f08f24ad4f61c85e46d9ff83bc5929fae488711a95d","4c8381e8217c15ede7146d92afddcde5402e99b6523964d74aa4c942eaa90316","https://www.tabroom.com/api/download_data.mhtml?tourn_id=37010",{"tournament":"37010"}],
["8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","6974be099ba32ce4368e11f9b20ed3a680ad2f5561074ab8d0fd08fc629eef84","https://api.tabroom.com/v1/rest/tourns/37011/invite",{"tournament":"37011"}],
["01674ef896265efc234d5d3599d7960677cbff5640f3ec4a489858ffb6e945ab","f48426cfe96946254163a85e6375785fa1a3e703fde039e8ef48ac5c2722e9a8","https://www.tabroom.com/api/download_data.mhtml?tourn_id=37011",{"tournament":"37011"}],
["671582454565b073aa466ebd8ad96f471ce318907c34ddbc51ab3bfcafab8253","a9b864b25c80134293bdc8e819863f868b6f2c12a667516906c3ce9e4a0420f6","https://api.tabroom.com/v1/rest/tourns/37029/invite",{"tournament":"37029"}],
["797f2cf11d550e044cf501a6dbbc7757c55d52f61bc4d473fbff7408d80690f5","d633da47a3cdb97b4ac508f32b8f9eabd5af5a0a0c99a43c3bef644fe631662c","https://www.tabroom.com/api/download_data.mhtml?tourn_id=37029",{"tournament":"37029"}],
["ddb03ad9755a50c2ef05c8f4150db2f184e804e003b256806d228c6b4493fb81","d885575cc92bc8d722819970d2dc08f409e572ed4677522748be8e840d8f301d","https://api.tabroom.com/v1/rest/tourns/37153/invite",{"tournament":"37153"}],
["821b57b854b9d789634afa424022c146c995b849986c08cb88476ee6c7f76f77","629e3ee5c623b536acfc38071ff17d8fdaa736389a0a2c7e53348662b552d08f","https://www.tabroom.com/api/download_data.mhtml?tourn_id=37153",{"tournament":"37153"}],
["18f7a62a3b9c33a5ef87a8fda04ff728bdbcdfbec6acbdeab62dece4e4d43b98","13211ad0953309d49a62f6bd1347116c1fb09107572f32bf1376ce1c868686a5","https://api.tabroom.com/v1/rest/tourns/37193/invite",{"tournament":"37193"}],
["68e5e6631e6e7729cb1ed0ce31cd6a31556017bb3ba72a5372172daf27ad4a4b","b5f1d8992e54fc21e59c99c74fa6203bb16035bcf2fb8ad5550425bfce53443b","https://www.tabroom.com/api/download_data.mhtml?tourn_id=37193",{"tournament":"37193"}],
["df3bf5ea126952436adbc3221ae712652bfe529f6002e5f65a417a47041d2122","250a1c7a140defe0833e6d13d761cdc3d1f0375abc0fe59914244a13cfad6e91","https://api.tabroom.com/v1/rest/tourns/37322/invite",{"tournament":"37322"}],
["53228ce267c32ad9e665e531682e3d58456c14c862f6bfd2d21cfea0535529a4","93a350cf65fe7ceedbba59fd18abf683cb150d98b2c04f1d64aa9d4de716c92c","https://www.tabroom.com/api/download_data.mhtml?tourn_id=37322",{"tournament":"37322"}],
["94510bbed07cdae73386d08858854b802286505eb105ea381029b9bfb6a98576","125540839d2bf78910f383f6fc346597bd7452bd2aab066a025c566cc1be0f15","https://api.tabroom.com/v1/rest/tourns/37376/invite",{"tournament":"37376"}],
["6cf7b1d7c378cd160c0a9223fc5d7229be7ffa5c34cd72d5980ba97fd346917f","af60b9442789af950d3a3b02c7516fe8bfda25ae02e33bae33d257503006e70d","https://www.tabroom.com/api/download_data.mhtml?tourn_id=37376",{"tournament":"37376"}],
["4022156f5d047bce6ce9651e2aabc29c4e394acdb222c9b2997302ebcc42385e","e1cbcf8d95d93c61a1df7ab8705cff1da2a38477b77b38a4ca243fd69110725b","https://api.tabroom.com/v1/rest/tourns/37578/invite",{"tournament":"37578"}],
["271238345a0fc67c27487edc15d5c0add5166b559def4086da90ad0f414a4d6c","af55a04a8c3115cd76cb2dfb67c658d57599ac50bf5c05e7e3468858c9fad5e7","https://www.tabroom.com/api/download_data.mhtml?tourn_id=37578",{"tournament":"37578"}],
["2efbd0095d7e444180b573957d7d05f914036f1dfcdacf60a940b7ba0c3f08bf","7aa499c410e6af7aecc9d729682188c3259ac365f704930ecc2bfbd5d7ae3fed","https://api.tabroom.com/v1/rest/tourns/37762/invite",{"tournament":"37762"}],
["0aa64d3728cdc5115e2b6666bf9fd160a7279c7066471876353c311e6764ced0","fa9ab2ca1e02824b4df68b75d93f73da58ae1d1d8b3d170fc3bdc16046d32290","https://www.tabroom.com/api/download_data.mhtml?tourn_id=37762",{"tournament":"37762"}],
["7f43d05e1d0d8abe99dbc1ecbf5cab659e1aa799b1c1bf1697d4b01be8d805d0","2c7fc416e33f2aee839252e3558da17a18dc661b186bf692be082760ce259a34","https://api.tabroom.com/v1/rest/tourns/37783/invite",{"tournament":"37783"}],
["112b81e35d1acb4619bb66680efea2810233bde55255e3bbdecd35eac394ca77","5afee5fb751600697e4ab2be21c1138c36971b6bcc9da18433ea413c3091ccc4","https://www.tabroom.com/api/download_data.mhtml?tourn_id=37783",{"tournament":"37783"}],
["3b0855690e0f48013f55369bbbd809ade2b4bc1b2b73909e486dcfa03d537a84","85e828b54f4737cf9874223ab8459acb46207d1618e450add17341b8f8e08ead","https://api.tabroom.com/v1/rest/tourns/37885/invite",{"tournament":"37885"}],
["d453e46ee6491caeab7406d9ecaa75fe7b8fa667ef7367c0d733599d96e25cf0","a992a9d76376716fee6770693f4bfe94bcfa778ddc2c916912aa403d112f4916","https://www.tabroom.com/api/download_data.mhtml?tourn_id=37885",{"tournament":"37885"}],
["313c7f51f7470ca3b373d53abb5f81d7ccba8b0ac4a6af068f1dc165e9b6c8a8","e0ffe15ab7456afb8fb2c19f3ad36085437ee31d709109cf90c6b6eb1cfa2bda","https://api.tabroom.com/v1/rest/tourns/37971/invite",{"tournament":"37971"}],
["1558890de60208bdf88782230ab0122da64780dc4cc8f81b5fb43451a592ea7e","e0d760ec115ce6ba49676c17d852b6dcbd827bbb56d5cf51cef9fa51a67b003d","https://www.tabroom.com/api/download_data.mhtml?tourn_id=37971",{"tournament":"37971"}],
["f99870e92d454b0ac010f43a60ff402517ac421845b41a24b8c3eaf61db8454f","9be00c1fe6bd0d5260aa263cdb6b6d57c5f3b8287aae4fdd019d904c10144cc5","https://api.tabroom.com/v1/rest/tourns/37980/invite",{"tournament":"37980"}],
["7cca8df7ce7f4e51427297ae8eeee8fb6d64b8b435d55c6f4791400b2f99ede6","67d725c31a369d6b89d07549f9818b7b61a3afb7afb85e4c698af80d9dab966d","https://www.tabroom.com/api/download_data.mhtml?tourn_id=37980",{"tournament":"37980"}],
["cd44b20fdfc2f9983e8864ef9e7fd928ff8aa7acfc0f26e10e034d1b553bf94b","b39e8050b4be3b128625f353dcb3dcde3dd892c019d57e6cc05010629fe19705","https://api.tabroom.com/v1/rest/tourns/38004/invite",{"tournament":"38004"}],
["15b7f956a1fb96ab0f00c40021aee1abbabdfe65d116e3f30b907989a1d21b08","cf928350f73c07a809946386d0a9cf01d568d37b0ed2347b151d55abd3de493c","https://www.tabroom.com/api/download_data.mhtml?tourn_id=38004",{"tournament":"38004"}],
["0eaf566ae4d3a4976f88555b5568dce35663911122d9a87d352cac47ccf72405","98383014c6906d215fafe5d679b36d98ea95ed28cdc09569192d95c0cedc6b59","https://api.tabroom.com/v1/rest/tourns/38490/invite",{"tournament":"38490"}],
["017e1b0cd9d3d2bafd9647cc90f648c91eb26685c9db96248a932f318ea68a61","0c82ee918b51335a3e2782aa3dec1d58d5ba313457645bd21012e802ca1ce792","https://www.tabroom.com/api/download_data.mhtml?tourn_id=38490",{"tournament":"38490"}],
["08460672912e72c3a20cd4b44cc66eb1d69165ad3e1891aed768c066b7923bdb","8f5cde7ae984a3e036c04b857ffdba0917da879afc7fc367934ea401996f9bd6","https://api.tabroom.com/v1/rest/tourns/38522/invite",{"tournament":"38522"}],
["680ffd79250d8059aafdffa1540002352c85219a383096826062ed8ccab3e6be","7b40f82e768429f92cb0aa657fb4dcbdca635f5301143ddc62a11fd6b6301035","https://www.tabroom.com/api/download_data.mhtml?tourn_id=38522",{"tournament":"38522"}],
["4499ea0c239cbb074e3dea4f358d007f4b0403f9f72382befec0049618d6fac3","a34db23d32709f85a2a417afdfe307118d1242acde5cd8704bfaef2642ff2399","https://api.tabroom.com/v1/rest/tourns/38602/invite",{"tournament":"38602"}],
["6ef33d606295f05821dca79d89f8fc06ee6a44f42aebffd4d11f1a2c1aea2cef","73e3b7a9cce5d2d29ab587cce5b3e8b21e15f2830b540b51a697094cce2a9d2a","https://www.tabroom.com/api/download_data.mhtml?tourn_id=38602",{"tournament":"38602"}],
["161e92f04cbf2127194ed727d6aed7b4407cba14abe5ed9b3289a2b078f2ac9e","838e0a99cc72a7f667b1cfb77689bb3805696521a13d8cabf8f7965e5cc28008","https://api.tabroom.com/v1/rest/tourns/38796/invite",{"tournament":"38796"}],
["bc50fa7c8c308f8f39c475c448412559e2a94adf29ab4b65f45b5947e7f6148f","050ab4c93735de13e876f9d437adf5b83e044106d7360b2d1dd15aa988890949","https://www.tabroom.com/api/download_data.mhtml?tourn_id=38796",{"tournament":"38796"}],
["27dea737e76c5d7ceea2b3fb5a44dd61322b2547bf6edc8079ae5651e3ded563","8dff76861cd7654c0e4126b12f1030768e03fcb4a213376dc9674cc47f05afad","https://api.tabroom.com/v1/rest/tourns/38894/invite",{"tournament":"38894"}],
["de867dc56f0204b66fb531413a86ea62d8cb76d8e472d432a529acbd27fd1c2c","63a56d23efa013b8a3e38b5ec281fc17ffad6b6a89da32655f3be09123731b0f","https://www.tabroom.com/api/download_data.mhtml?tourn_id=38894",{"tournament":"38894"}],
["c7b348da23811f6fa633d59772bd3a713fa8c9797f9580d12c4fa6932625da55","5e382efd2fb52dddb186a23c6c485f8d8492b666f766c459f4fbdbd2524f7695","https://api.tabroom.com/v1/rest/tourns/38955/invite",{"tournament":"38955"}],
["0e1222b677eeb579438f2d816387d72f75635503c4553561270f2c66e6df10b0","984aca21dd6037f1908d5f9472c159fb1f820d53e123751cec7372c3d73e820a","https://www.tabroom.com/api/download_data.mhtml?tourn_id=38955",{"tournament":"38955"}],
["460eb793d96a1b8b7577ff8857479237187811392e50bd9f5ed9009f13951f88","b32c7dfb22da64510533dcd2dc96470146cfd94b1244f2f9d568eab62bc27fb5","https://api.tabroom.com/v1/rest/tourns/38966/invite",{"tournament":"38966"}],
["5650d5c038e0288280f5b18b6ed7979e05bd8ebcc5284bc8d70ec2c5192a1e81","868da740704191a36e391b75a2f42ba2615e5e0c17ac9dec7b32e519f8a55290","https://www.tabroom.com/api/download_data.mhtml?tourn_id=38966",{"tournament":"38966"}],
["72a76a1767e909e273d22accf0849c3ff4d9829b1a89ade040482d0f454caa4f","7a6ed1db5a97d795a0ae7b472fbe3bfe07a89f9193e6f577bffbef2308a13649","https://api.tabroom.com/v1/rest/tourns/38986/invite",{"tournament":"38986"}],
["037a997a743325e80eacba7efdf066e207491dcb82bda411e1edc15f09b1edae","f9cd26e6e33633599d77f4e9bb460f66e03c3bbbc677448e12ce7d12d6dda37a","https://www.tabroom.com/api/download_data.mhtml?tourn_id=38986",{"tournament":"38986"}],
["ad8c9ba616356e61748d749cc1123923ff6b2e7ce7b50a577d362744e297ba63","511770844cf9a4f5ae9c40634b32bd4ba6df38cdd416fab822b7cadaabce88de","https://api.tabroom.com/v1/rest/tourns/38995/invite",{"tournament":"38995"}],
["bee6e5c04f1794b7d9eb851c596051c6a1778a9840a19549ddf75b68c9ad4fad","0543ec91970fc47cc090fc69fd84591bc6fc3e7fdf17c98471295c5c2b5677c2","https://www.tabroom.com/api/download_data.mhtml?tourn_id=38995",{"tournament":"38995"}],
["c901b97e9d0821542124d160f720fb26e2b40464067035ba42096d45aa82a1f8","131465622035ccedd08b5bf90420b45ddc5402cc770729255f3b4cb4323c2d27","https://api.tabroom.com/v1/rest/tourns/39031/invite",{"tournament":"39031"}],
["5b4da41fe74bbcc5d8fd399bd294bd7c73a3148489dab88d9cdc67f509923fb7","09ce0f1f0138fa651866adcc0ab780770fdd2d3d18ebb8343b557ee6b5ed4031","https://www.tabroom.com/api/download_data.mhtml?tourn_id=39031",{"tournament":"39031"}],
["7e9e9a3e37c9a3c6b70c5fa975ae5ca057ebfaf8b4873803b7dc62b030162694","316642f8cb05efa4df9aabb673e41753dab089b1563bec3dd967731deb2e4823","https://api.tabroom.com/v1/rest/tourns/39232/invite",{"tournament":"39232"}],
["e688c03a17d4b56b71f0984e84e0c6a38515855d3ced54cc4944d5ab03a544d7","e13f1a11e6a370f3de8d00163c9b8a53cfc4ba25411ee392d91bbc43f835e431","https://www.tabroom.com/api/download_data.mhtml?tourn_id=39232",{"tournament":"39232"}],
["03f04749a4931cbd662434d5a1a0fe215000e90661930183ea556605c7db1c08","3a4c8edd47651afe42437088da14daec933e651445116e8e706d35348f43daa2","https://api.tabroom.com/v1/rest/tourns/39306/invite",{"tournament":"39306"}],
["207be3df5449f20d63350d8f2c232f5fa2bdd73e79355b18716a7ea43e1d0ac1","bae9deb51865f949b0047d4ea5c65b2964c3d6d4efcfdafe30df1196a598d203","https://www.tabroom.com/api/download_data.mhtml?tourn_id=39306",{"tournament":"39306"}],
["e3e31b2dbfec057eb6de466d5518f66f05bd95108cb92e367892a2bff6e10820","0b3804e5eecf8054683b3635755828d41ecf0aa924b0193e09527c6af8f306bf","https://api.tabroom.com/v1/rest/tourns/39405/invite",{"tournament":"39405"}],
["db0f27ffc1cdd9a7107f70d338ac7e14e4299e7a812ce9eecc11cbefdb3ba8f8","3e6bc949deeb5c517daf5db9168e234588c6f1c27cc946edbb4c14648b127a2f","https://www.tabroom.com/api/download_data.mhtml?tourn_id=39405",{"tournament":"39405"}],
["2643191caad1f9c5a994ab957124fcbc270577e0f282b0a9b3a8ea5b370b1f2e","e1210b5cd29b4c14af357b54770635131f2b7168250f1c2a0df01f790a94c985","https://api.tabroom.com/v1/rest/tourns/39452/invite",{"tournament":"39452"}],
["17fa66e4f33832d87ca3956d91bc3a4a2314e7bd8d4ef36e5795b70701db8e0d","316ba349422cb4b8e5de57ec6c20b85af9c70db2f4d74a15ad858244671a225e","https://www.tabroom.com/api/download_data.mhtml?tourn_id=39452",{"tournament":"39452"}],
["9ce8177d072cada392948771ee4686a8afdf54253fea24b438353f39505e82be","9b29be1329b2ea38d4dc3d3810e326b5940a46293c446662b0f97d31d371f198","https://api.tabroom.com/v1/rest/tourns/39462/invite",{"tournament":"39462"}],
["96b3e2163d15b6243916bf6d7c679d1f804be28554abf6f7cb56e173e24153b1","8f67581d85cdd589876a60ffc1459de8497f3338c76ac245bb033a564b14903e","https://www.tabroom.com/api/download_data.mhtml?tourn_id=39462",{"tournament":"39462"}]
]$captures$;
  approved_memberships constant jsonb := $memberships$[
["35973","338258","included","Novice","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","9e8e959d4fd4f1c5ee21d425d53d4d82fce1525ab4bdb7a2145e04dfa8f3d164","/Events/0"],
["35973","338260","included","Open","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","9e8e959d4fd4f1c5ee21d425d53d4d82fce1525ab4bdb7a2145e04dfa8f3d164","/Events/1"],
["35973","338259","excluded","Observer","attendee","Observer or scout registration","b53f181aa3d81246c1dff8baf7f9cb16602ae2f31c62ecd2db5271101af9965b","/categories/0/events/1"],
["36165","339673","included","Run for the Roses","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","96a7f6ba75241cfd7184a0eacea968ab6c4626d0490c88e3ec5fc71c01f37cc1","/Events/0"],
["36165","343482","excluded","Observers","attendee","Observer or scout registration","7041d35afa9a92d65dbe5a83f0173c872e20027e230a7b04dd8155f41126ca58","/categories/0/events/0"],
["36166","339674","included","Novice","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","d9b9f3f5b86c45d3434f700da5aa83b9230ed790e5ea2fe417538d9d6f3a0687","/Events/0"],
["36166","339675","included","Open","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","d9b9f3f5b86c45d3434f700da5aa83b9230ed790e5ea2fe417538d9d6f3a0687","/Events/1"],
["36166","339676","included","Wildcat","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","d9b9f3f5b86c45d3434f700da5aa83b9230ed790e5ea2fe417538d9d6f3a0687","/Events/2"],
["36167","339677","included","NDT JV","debate","Explicit policy or NDT/CEDA division in the college circuit","50e41d301c84be30fc65518629a76f2509e9db424bdc145dfc2cbfe62bcc45a3","/Events/0"],
["36167","339678","included","NDT Novice","debate","Explicit policy or NDT/CEDA division in the college circuit","50e41d301c84be30fc65518629a76f2509e9db424bdc145dfc2cbfe62bcc45a3","/Events/1"],
["36167","339679","included","NDT Varsity","debate","Explicit policy or NDT/CEDA division in the college circuit","50e41d301c84be30fc65518629a76f2509e9db424bdc145dfc2cbfe62bcc45a3","/Events/2"],
["36167","339680","excluded","Observer","debate","Observer or scout registration","50e41d301c84be30fc65518629a76f2509e9db424bdc145dfc2cbfe62bcc45a3","/Events/3"],
["36226","340313","included","1-Open","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","350be2807603738af69ea91de759f28d4c2d9b6c3d8523ebb2f50f416d32e9cf","/Events/0"],
["36226","340315","included","3-Nov","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","350be2807603738af69ea91de759f28d4c2d9b6c3d8523ebb2f50f416d32e9cf","/Events/1"],
["36419","341756","included","Open Policy","debate","Explicit policy or NDT/CEDA division in the college circuit","1a19d17d647f8c62876e0ef182de5452a9ded5d6c4e6a59f77f62dbd2468ed71","/Events/0"],
["36419","341757","excluded","Open CARD","debate","Structured division name identifies a different format","1a19d17d647f8c62876e0ef182de5452a9ded5d6c4e6a59f77f62dbd2468ed71","/Events/1"],
["36419","342191","excluded","Junior CARD","debate","Structured division name identifies a different format","1a19d17d647f8c62876e0ef182de5452a9ded5d6c4e6a59f77f62dbd2468ed71","/Events/2"],
["36419","357636","included","JV Policy","debate","Explicit policy or NDT/CEDA division in the college circuit","1a19d17d647f8c62876e0ef182de5452a9ded5d6c4e6a59f77f62dbd2468ed71","/Events/3"],
["36419","341755","excluded","Observers","attendee","Observer or scout registration","84cf2bc5c669df98315e6156c7f8b166ad4b514bdd9702500670e92833361ccc","/categories/2/events/0"],
["36431","342029","included","JV","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","b1b9838a6779e5a922179800345eda44c6948469ad413c6bdc2db457825b04bf","/Events/0"],
["36431","342030","included","Novice","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","b1b9838a6779e5a922179800345eda44c6948469ad413c6bdc2db457825b04bf","/Events/1"],
["36431","342031","included","Open","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","b1b9838a6779e5a922179800345eda44c6948469ad413c6bdc2db457825b04bf","/Events/2"],
["36610","343690","included","JV-ADA Fall Champs","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","15d5a534d561ab10a74dbf0a8f421537c7ff19afac469c96db44668c6bd39e10","/Events/0"],
["36610","343691","included","Novice-ADA Fall Champs","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","15d5a534d561ab10a74dbf0a8f421537c7ff19afac469c96db44668c6bd39e10","/Events/1"],
["36610","343692","included","Shirley","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","15d5a534d561ab10a74dbf0a8f421537c7ff19afac469c96db44668c6bd39e10","/Events/2"],
["36610","343693","excluded","X-Observer Division","debate","Observer or scout registration","15d5a534d561ab10a74dbf0a8f421537c7ff19afac469c96db44668c6bd39e10","/Events/3"],
["36669","344529","included","Junior Varsity","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","8555f13b078227463746b04fef83346235b51809c8aef97d926c7a2c8a79ac1e","/Events/0"],
["36669","344530","included","Novice","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","8555f13b078227463746b04fef83346235b51809c8aef97d926c7a2c8a79ac1e","/Events/1"],
["36669","344532","included","Open","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","8555f13b078227463746b04fef83346235b51809c8aef97d926c7a2c8a79ac1e","/Events/2"],
["36669","344531","excluded","Observers","attendee","Observer or scout registration","14088a5b8b03618150dba943f54697b7d609902663fa9d08a16d28d56fed6141","/categories/0/events/2"],
["36743","345461","included","Novice","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","a9f0dcc16dc19317e07ca8b6cd74d9b79e0d8eeee1601c22649945c59d9e0d3b","/Events/0"],
["36743","345462","included","Open","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","a9f0dcc16dc19317e07ca8b6cd74d9b79e0d8eeee1601c22649945c59d9e0d3b","/Events/1"],
["36743","345463","unresolved","JV","academic","Conflicting or insufficient structured format evidence","a9f0dcc16dc19317e07ca8b6cd74d9b79e0d8eeee1601c22649945c59d9e0d3b","/Events/2"],
["36816","346388","included","Junior Varsity","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","1ae4c1dd1fad9bad4a8c5d325d62cce36423fbe927505ecb890ebf18b2d0df35","/Events/0"],
["36816","346389","included","Novice","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","1ae4c1dd1fad9bad4a8c5d325d62cce36423fbe927505ecb890ebf18b2d0df35","/Events/1"],
["36816","346391","included","Open","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","1ae4c1dd1fad9bad4a8c5d325d62cce36423fbe927505ecb890ebf18b2d0df35","/Events/2"],
["36936","347453","included","Novice","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","aee01713fc0a9bdb816f4a95a5b16d2667f98a087eec4d4e04af0440a17bda8e","/Events/0"],
["36936","347454","included","Open","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","aee01713fc0a9bdb816f4a95a5b16d2667f98a087eec4d4e04af0440a17bda8e","/Events/1"],
["36936","347455","included","Junior Varsity","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","aee01713fc0a9bdb816f4a95a5b16d2667f98a087eec4d4e04af0440a17bda8e","/Events/2"],
["37010","348102","included","JV Policy Debate","debate","Explicit policy or NDT/CEDA division in the college circuit","4d29f3e8c355b1546b78c8f0f0ca32e8e315baa3d645f2634bcf87f32ff9138d","/Events/0"],
["37010","348103","included","Novice Policy Debate","debate","Explicit policy or NDT/CEDA division in the college circuit","4d29f3e8c355b1546b78c8f0f0ca32e8e315baa3d645f2634bcf87f32ff9138d","/Events/1"],
["37010","348104","included","Open Policy Debate","debate","Explicit policy or NDT/CEDA division in the college circuit","4d29f3e8c355b1546b78c8f0f0ca32e8e315baa3d645f2634bcf87f32ff9138d","/Events/2"],
["37011","348375","excluded","A College Communication Analysis","speech","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/0"],
["37011","348376","excluded","A College Extemp","speech","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/1"],
["37011","348377","excluded","A College Informative","speech","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/2"],
["37011","348378","excluded","A College Program of Oral Interp","speech","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/3"],
["37011","348379","excluded","A College Prose","speech","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/4"],
["37011","348380","excluded","B College After Dinner Speaking","speech","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/5"],
["37011","348381","excluded","B College Dramatic Interp","speech","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/6"],
["37011","348382","excluded","B College Duo","speech","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/7"],
["37011","348383","excluded","B College Impromptu","speech","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/8"],
["37011","348384","excluded","B College Persuasion","speech","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/9"],
["37011","348385","excluded","B College Poetry","speech","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/10"],
["37011","348386","excluded","JV APDA","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/11"],
["37011","348387","excluded","JV British Parliamentary","wudc","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/12"],
["37011","348388","excluded","JV CARD","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/13"],
["37011","348389","excluded","JV CFP","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/14"],
["37011","348390","excluded","JV HS Lincoln Douglas","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/15"],
["37011","348391","excluded","JV HS Policy","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/16"],
["37011","348392","excluded","JV HS Public Forum","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/17"],
["37011","348393","excluded","JV IPDA","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/18"],
["37011","348394","included","JV NDT/CEDA","debate","Explicit policy or NDT/CEDA division in the college circuit","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/19"],
["37011","348395","excluded","JV NEDA","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/20"],
["37011","348396","excluded","JV NFA LD","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/21"],
["37011","348397","excluded","JV NPDA/NPTE","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/22"],
["37011","348398","excluded","JV Team IPDA","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/23"],
["37011","348399","excluded","Novice APDA","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/24"],
["37011","348400","excluded","Novice British Parliamentary","wudc","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/25"],
["37011","348401","excluded","Novice CARD","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/26"],
["37011","348402","excluded","Novice CPF","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/27"],
["37011","348403","excluded","Novice HS Lincoln Douglas","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/28"],
["37011","348404","excluded","Novice HS Policy","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/29"],
["37011","348405","excluded","Novice HS Public Forum","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/30"],
["37011","348407","included","Novice NDT/CEDA","debate","Explicit policy or NDT/CEDA division in the college circuit","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/31"],
["37011","348408","excluded","Novice NEDA","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/32"],
["37011","348409","excluded","Novice NFA-LD","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/33"],
["37011","348410","excluded","Novice NPDA/NPTE","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/34"],
["37011","348411","excluded","Novice Team IPDA","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/35"],
["37011","348412","excluded","Varsity APDA","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/36"],
["37011","348413","excluded","Varsity British Parliamentary","wudc","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/37"],
["37011","348414","excluded","Varsity CARD","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/38"],
["37011","348415","excluded","Varsity CPF","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/39"],
["37011","348416","excluded","Varsity HS Lincoln Douglas","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/40"],
["37011","348417","excluded","Varsity HS Policy","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/41"],
["37011","348418","excluded","Varsity HS Public Forum","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/42"],
["37011","348419","excluded","Varsity IPDA","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/43"],
["37011","348420","included","Varsity NDT/CEDA","debate","Explicit policy or NDT/CEDA division in the college circuit","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/44"],
["37011","348421","excluded","Varsity NEDA","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/45"],
["37011","348422","excluded","Varsity NFA LD","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/46"],
["37011","348423","excluded","Varsity NPDA/NPTE","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/47"],
["37011","348424","excluded","Varsity Team IPDA","debate","Mixed-format tournament, division outside the explicit college NDT/CEDA track","8c88746ef0c9aff491f3ae651e1d38587289d6af0246de0864f9796cfb74163f","/Events/48"],
["37029","348498","included","JV","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","671582454565b073aa466ebd8ad96f471ce318907c34ddbc51ab3bfcafab8253","/Events/0"],
["37029","348499","included","Novice","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","671582454565b073aa466ebd8ad96f471ce318907c34ddbc51ab3bfcafab8253","/Events/1"],
["37029","348500","included","Open","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","671582454565b073aa466ebd8ad96f471ce318907c34ddbc51ab3bfcafab8253","/Events/2"],
["37153","350028","included","JV","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","ddb03ad9755a50c2ef05c8f4150db2f184e804e003b256806d228c6b4493fb81","/Events/0"],
["37153","350029","included","Novice","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","ddb03ad9755a50c2ef05c8f4150db2f184e804e003b256806d228c6b4493fb81","/Events/1"],
["37153","350031","included","Open","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","ddb03ad9755a50c2ef05c8f4150db2f184e804e003b256806d228c6b4493fb81","/Events/2"],
["37153","350030","excluded","Observers","attendee","Observer or scout registration","821b57b854b9d789634afa424022c146c995b849986c08cb88476ee6c7f76f77","/categories/1/events/0"],
["37193","363930","included","Open","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","18f7a62a3b9c33a5ef87a8fda04ff728bdbcdfbec6acbdeab62dece4e4d43b98","/Events/0"],
["37193","363932","included","Junior Varsity","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","18f7a62a3b9c33a5ef87a8fda04ff728bdbcdfbec6acbdeab62dece4e4d43b98","/Events/1"],
["37322","352124","included","Round Robin","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","df3bf5ea126952436adbc3221ae712652bfe529f6002e5f65a417a47041d2122","/Events/0"],
["37376","352837","included","JV","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","94510bbed07cdae73386d08858854b802286505eb105ea381029b9bfb6a98576","/Events/0"],
["37376","352838","included","Novice","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","94510bbed07cdae73386d08858854b802286505eb105ea381029b9bfb6a98576","/Events/1"],
["37376","352839","included","Open","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","94510bbed07cdae73386d08858854b802286505eb105ea381029b9bfb6a98576","/Events/2"],
["37578","355635","included","Novice Policy","debate","Explicit policy or NDT/CEDA division in the college circuit","4022156f5d047bce6ce9651e2aabc29c4e394acdb222c9b2997302ebcc42385e","/Events/0"],
["37578","355636","included","Open Policy","debate","Explicit policy or NDT/CEDA division in the college circuit","4022156f5d047bce6ce9651e2aabc29c4e394acdb222c9b2997302ebcc42385e","/Events/1"],
["37578","355637","excluded","Open CARD","debate","Structured division name identifies a different format","4022156f5d047bce6ce9651e2aabc29c4e394acdb222c9b2997302ebcc42385e","/Events/2"],
["37578","355638","excluded","Junior CARD","debate","Structured division name identifies a different format","4022156f5d047bce6ce9651e2aabc29c4e394acdb222c9b2997302ebcc42385e","/Events/3"],
["37762","357268","included","Novice JV Round Robin (CEDA)","debate","Explicit policy or NDT/CEDA division in the college circuit","2efbd0095d7e444180b573957d7d05f914036f1dfcdacf60a940b7ba0c3f08bf","/Events/0"],
["37762","357521","excluded","NPDA pt. 2","debate","Structured division name identifies a different format","2efbd0095d7e444180b573957d7d05f914036f1dfcdacf60a940b7ba0c3f08bf","/Events/1"],
["37762","357523","excluded","NPDA pt. 1 (Topic Area Tournament)","debate","Structured division name identifies a different format","2efbd0095d7e444180b573957d7d05f914036f1dfcdacf60a940b7ba0c3f08bf","/Events/2"],
["37762","357541","included","Open CEDA","debate","Explicit policy or NDT/CEDA division in the college circuit","2efbd0095d7e444180b573957d7d05f914036f1dfcdacf60a940b7ba0c3f08bf","/Events/3"],
["37783","357351","unresolved","Junior","debate","Conflicting or insufficient structured format evidence","7f43d05e1d0d8abe99dbc1ecbf5cab659e1aa799b1c1bf1697d4b01be8d805d0","/Events/0"],
["37783","357352","unresolved","Open","debate","Conflicting or insufficient structured format evidence","7f43d05e1d0d8abe99dbc1ecbf5cab659e1aa799b1c1bf1697d4b01be8d805d0","/Events/1"],
["37885","358652","included","Junior Varsity","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","3b0855690e0f48013f55369bbbd809ade2b4bc1b2b73909e486dcfa03d537a84","/Events/0"],
["37885","358653","included","Novice","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","3b0855690e0f48013f55369bbbd809ade2b4bc1b2b73909e486dcfa03d537a84","/Events/1"],
["37885","358654","included","Varsity","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","3b0855690e0f48013f55369bbbd809ade2b4bc1b2b73909e486dcfa03d537a84","/Events/2"],
["37971","359570","included","Open","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","313c7f51f7470ca3b373d53abb5f81d7ccba8b0ac4a6af068f1dc165e9b6c8a8","/Events/0"],
["37971","359571","included","Novice","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","313c7f51f7470ca3b373d53abb5f81d7ccba8b0ac4a6af068f1dc165e9b6c8a8","/Events/1"],
["37980","359717","included","JV","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","f99870e92d454b0ac010f43a60ff402517ac421845b41a24b8c3eaf61db8454f","/Events/0"],
["37980","359718","included","Novice","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","f99870e92d454b0ac010f43a60ff402517ac421845b41a24b8c3eaf61db8454f","/Events/1"],
["37980","359719","included","Open","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","f99870e92d454b0ac010f43a60ff402517ac421845b41a24b8c3eaf61db8454f","/Events/2"],
["37980","359720","excluded","xObserver","attendee","Observer or scout registration","7cca8df7ce7f4e51427297ae8eeee8fb6d64b8b435d55c6f4791400b2f99ede6","/categories/0/events/3"],
["38004","359935","included","JV","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","cd44b20fdfc2f9983e8864ef9e7fd928ff8aa7acfc0f26e10e034d1b553bf94b","/Events/0"],
["38004","359936","included","Novice","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","cd44b20fdfc2f9983e8864ef9e7fd928ff8aa7acfc0f26e10e034d1b553bf94b","/Events/1"],
["38004","359937","included","Open","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","cd44b20fdfc2f9983e8864ef9e7fd928ff8aa7acfc0f26e10e034d1b553bf94b","/Events/2"],
["38004","359938","excluded","xObserver","attendee","Observer or scout registration","15b7f956a1fb96ab0f00c40021aee1abbabdfe65d116e3f30b907989a1d21b08","/categories/0/events/3"],
["38490","365660","excluded","JV CARD","debate","Structured division name identifies a different format","0eaf566ae4d3a4976f88555b5568dce35663911122d9a87d352cac47ccf72405","/Events/0"],
["38490","365661","excluded","Varsity CARD","debate","Structured division name identifies a different format","0eaf566ae4d3a4976f88555b5568dce35663911122d9a87d352cac47ccf72405","/Events/1"],
["38490","365662","included","Open policy","debate","Explicit policy or NDT/CEDA division in the college circuit","0eaf566ae4d3a4976f88555b5568dce35663911122d9a87d352cac47ccf72405","/Events/2"],
["38522","366202","included","JV","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","08460672912e72c3a20cd4b44cc66eb1d69165ad3e1891aed768c066b7923bdb","/Events/0"],
["38522","366203","included","Novice","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","08460672912e72c3a20cd4b44cc66eb1d69165ad3e1891aed768c066b7923bdb","/Events/1"],
["38522","366204","included","Open","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","08460672912e72c3a20cd4b44cc66eb1d69165ad3e1891aed768c066b7923bdb","/Events/2"],
["38602","367102","included","Policy Debate","debate","Explicit policy or NDT/CEDA division in the college circuit","4499ea0c239cbb074e3dea4f358d007f4b0403f9f72382befec0049618d6fac3","/Events/0"],
["38796","369209","included","NDT Qualifier","debate","Explicit policy or NDT/CEDA division in the college circuit","161e92f04cbf2127194ed727d6aed7b4407cba14abe5ed9b3289a2b078f2ac9e","/Events/0"],
["38796","369210","unresolved","Pacific Championship Novice","debate","Conflicting or insufficient structured format evidence","161e92f04cbf2127194ed727d6aed7b4407cba14abe5ed9b3289a2b078f2ac9e","/Events/1"],
["38796","369211","unresolved","Pacific Champs Open","debate","Conflicting or insufficient structured format evidence","161e92f04cbf2127194ed727d6aed7b4407cba14abe5ed9b3289a2b078f2ac9e","/Events/2"],
["38796","369932","excluded","Open CARD","debate","Structured division name identifies a different format","161e92f04cbf2127194ed727d6aed7b4407cba14abe5ed9b3289a2b078f2ac9e","/Events/3"],
["38796","369933","excluded","Junior CARD","debate","Structured division name identifies a different format","161e92f04cbf2127194ed727d6aed7b4407cba14abe5ed9b3289a2b078f2ac9e","/Events/4"],
["38894","370675","included","Junior Varsity","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","27dea737e76c5d7ceea2b3fb5a44dd61322b2547bf6edc8079ae5651e3ded563","/Events/0"],
["38894","370676","included","Novice","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","27dea737e76c5d7ceea2b3fb5a44dd61322b2547bf6edc8079ae5651e3ded563","/Events/1"],
["38955","371325","included","Varsity","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","c7b348da23811f6fa633d59772bd3a713fa8c9797f9580d12c4fa6932625da55","/Events/0"],
["38955","373352","excluded","Observer","attendee","Observer or scout registration","0e1222b677eeb579438f2d816387d72f75635503c4553561270f2c66e6df10b0","/categories/0/events/0"],
["38966","371615","included","Round Robin","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","460eb793d96a1b8b7577ff8857479237187811392e50bd9f5ed9009f13951f88","/Events/0"],
["38986","371837","included","Brick City RR","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","72a76a1767e909e273d22accf0849c3ff4d9829b1a89ade040482d0f454caa4f","/Events/0"],
["38995","371937","included","Mid America Championship","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","ad8c9ba616356e61748d749cc1123923ff6b2e7ce7b50a577d362744e297ba63","/Events/0"],
["38995","371938","included","NDT Qualifying","debate","Explicit policy or NDT/CEDA division in the college circuit","ad8c9ba616356e61748d749cc1123923ff6b2e7ce7b50a577d362744e297ba63","/Events/1"],
["39031","372405","included","Open Policy","debate","Explicit policy or NDT/CEDA division in the college circuit","c901b97e9d0821542124d160f720fb26e2b40464067035ba42096d45aa82a1f8","/Events/0"],
["39031","372406","included","JV Policy","debate","Explicit policy or NDT/CEDA division in the college circuit","c901b97e9d0821542124d160f720fb26e2b40464067035ba42096d45aa82a1f8","/Events/1"],
["39031","372407","included","Novice Policy","debate","Explicit policy or NDT/CEDA division in the college circuit","c901b97e9d0821542124d160f720fb26e2b40464067035ba42096d45aa82a1f8","/Events/2"],
["39232","374707","included","Districts","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","7e9e9a3e37c9a3c6b70c5fa975ae5ca057ebfaf8b4873803b7dc62b030162694","/Events/0"],
["39232","374708","included","Junior Varsity","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","7e9e9a3e37c9a3c6b70c5fa975ae5ca057ebfaf8b4873803b7dc62b030162694","/Events/1"],
["39232","374709","included","Novice","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","7e9e9a3e37c9a3c6b70c5fa975ae5ca057ebfaf8b4873803b7dc62b030162694","/Events/2"],
["39306","375370","included","Open","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","03f04749a4931cbd662434d5a1a0fe215000e90661930183ea556605c7db1c08","/Events/0"],
["39306","375371","excluded","xOn Site Observers","attendee","Observer or scout registration","207be3df5449f20d63350d8f2c232f5fa2bdd73e79355b18716a7ea43e1d0ac1","/categories/0/events/1"],
["39306","375372","excluded","xScouts","attendee","Observer or scout registration","207be3df5449f20d63350d8f2c232f5fa2bdd73e79355b18716a7ea43e1d0ac1","/categories/0/events/2"],
["39405","376281","included","NDT Qualifiers","debate","Explicit policy or NDT/CEDA division in the college circuit","e3e31b2dbfec057eb6de466d5518f66f05bd95108cb92e367892a2bff6e10820","/Events/0"],
["39452","376632","included","D2 Qualification","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","2643191caad1f9c5a994ab957124fcbc270577e0f282b0a9b3a8ea5b370b1f2e","/Events/0"],
["39462","376666","included","District 4","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","9ce8177d072cada392948771ee4686a8afdf54253fea24b438353f39505e82be","/Events/0"],
["39462","376667","included","District 5","debate","NDT-CEDA circuit membership and structured debate division in a college policy tournament","9ce8177d072cada392948771ee4686a8afdf54253fea24b438353f39505e82be","/Events/1"]
]$memberships$;
BEGIN
  SELECT id INTO revision FROM season_revisions
  WHERE scope_id = 'tabroom-college-policy-2025-26' AND version = 1;

  -- Fresh and pre-ingestion upgrades have no historical revision to repair.
  IF revision IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT FROM season_revisions
    WHERE id = revision AND predecessor_version IS NULL
      AND definition->>'pin' = '5273059fdb3250d1352e9e36beee70b116800e0cc81b4825cc57f5d683e189ac'
  ) THEN
    RAISE EXCEPTION 'Unexpected pinned season revision';
  END IF;

  IF EXISTS (
    SELECT FROM jsonb_array_elements(approved_captures) pin
    WHERE NOT EXISTS (
      SELECT FROM warehouse_captures c
      WHERE c.id = pin->>0 AND c.response_digest = pin->>1 AND c.route = pin->>2
        AND c.request_scope = pin->3 AND c.provider = 'tabroom' AND c.authorization_class = 'public'
        AND c.grant_scope IS NULL AND c.purpose = 'season membership evidence'
        AND c.retention_policy = 'public-evidence' AND c.audience IN ('internal', 'public')
    )
  ) THEN
    RAISE EXCEPTION 'Pinned season capture missing or ineligible';
  END IF;

  IF (SELECT count(*) FROM season_memberships WHERE revision_id = revision)
        <> jsonb_array_length(approved_memberships)
    OR (SELECT count(*) FROM season_membership_evidence l
        JOIN season_memberships m ON m.id = l.membership_id WHERE m.revision_id = revision)
        <> jsonb_array_length(approved_memberships)
    OR EXISTS (
      SELECT FROM jsonb_array_elements(approved_memberships) pin
      WHERE NOT EXISTS (
        SELECT FROM season_memberships m
        JOIN events e ON e.id = m.event_id
        JOIN season_membership_evidence l ON l.membership_id = m.id
        JOIN warehouse_evidence w ON w.id = l.evidence_id
        WHERE m.revision_id = revision AND e.provider = 'tabroom'
          AND e.tournament_source_id = pin->>0 AND e.event_source_id = pin->>1
          AND m.decision = pin->>2 AND m.classification->>'division' = pin->>3
          AND m.classification->>'sourceType' = pin->>4 AND m.rationale = pin->>5
          AND m.classification->>'circuit' = 'NDT-CEDA'
          AND w.snapshot_id = pin->>6 AND w.source_pointer = pin->>7
          AND w.subject_id = e.id AND w.raw_source_id #>> '{}' = pin->>1
          AND w.observed_value->>'name' = pin->>3
          AND w.observed_value->>'type' = pin->>4
          AND w.output_role = 'season-event-classification' AND w.parser_version = 1
          AND w.verification = 'observed' AND w.observation_state = 'observed'
          AND w.authorization_class = 'public' AND w.grant_scope IS NULL
          AND w.purpose = 'season membership evidence'
          AND w.retention_policy = 'public-evidence' AND w.audience IN ('internal', 'public')
      )
    ) THEN
    RAISE EXCEPTION 'Pinned season membership lineage mismatch';
  END IF;

  -- Changing a capture must never make an unrelated observation public.
  IF EXISTS (
    SELECT FROM warehouse_captures c JOIN warehouse_evidence w ON w.snapshot_id = c.id
    WHERE c.audience = 'internal' AND c.id IN (SELECT pin->>0 FROM jsonb_array_elements(approved_captures) pin)
      AND w.audience = 'public' AND w.authorization_class = 'public' AND w.grant_scope IS NULL
  ) THEN
    RAISE EXCEPTION 'Season capture repair would expose existing public-labelled evidence';
  END IF;

  UPDATE warehouse_captures SET audience = 'public'
  WHERE audience = 'internal'
    AND id IN (SELECT pin->>0 FROM jsonb_array_elements(approved_captures) pin);

  UPDATE warehouse_evidence SET audience = 'public'
  WHERE audience = 'internal' AND id IN (
    SELECT l.evidence_id FROM season_membership_evidence l
    JOIN season_memberships m ON m.id = l.membership_id WHERE m.revision_id = revision
  );
END
$repair$;
