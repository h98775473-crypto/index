import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: "AIzaSyBo_kA9bsqqPHm2gK-JCS2wFvw-K-hrZ1I" });


const word = $("#keyword")[0];
const henu = $("#hen_u")[0];
const hens = $("#hen_s")[0];
const zyu = $("#zyusyo")[0];
const haba = $("#haba")[0];
const ryou = $("#ryou")[0];
let response;
let jsonresponse;
let resultnow = 0;
let resultlength = 0;
let responseopensc;
let jsonopensc;
let temp;


//出力させたいJSON構造（スキーマ）をあらかじめ宣言しておく
const schema_1 = {
    type: "ARRAY",
    items: {
        type: "OBJECT",
        properties: {
            sc_name: {
                type: "STRING",
                description: "大学名"
            },
            sc_faculty: {
                type: "STRING",
                description: "学部名"
            },
            sc_info: {
                type: "STRING",
                description: "その大学及び学部の情報をなるべく関係を調べている単語がどのように関わっているか詳しく50字程度にまとめた文章"
            },
            sc_url: {
                type: "STRING",
                description: "大学ホームページのトップのURL"
            }
        },
        required: ["sc_name", "sc_faculty", "sc_info", "sc_url"]
    }
}

const schema_2 = {
    type: "ARRAY",
    items: {
        type: "object",
        properties: {
            faculty: {
                type: "STRING",
                description: "なんらかの学問の中で使われる単語"
            }
        },
        required: ["faculty"]
    }
}

//ここまで



async function pagess() {
    let p = "";
    for (let i = 0; i < resultlength / 3; i++) {
        if (i == resultnow / 3) {
            p += "●";
        } else {
            p += "○";
        }
    }
    $("#pages").html(p)
}


//検索処理
$("#kensaku").on("click", async function () {
    if (word.value != "" && haba.value >= 1 && haba.value <= 11 && ryou.value >= 10 && ryou.value <= 300) {
        $("#pageh").addClass("hidden");
        $("#pagem").addClass("hidden");
        $("#pages").html("検索中...\nこの作業は数分かかる可能性があります")
        for (let i = 0; i < 3; i++) {
            $("#k" + String(i + 1)).removeClass("box-item3")
            $("#k" + String(i + 1)).addClass("box-item3_")
            $("#kouho" + String(i + 1)).html("");
            $("#urlkouho" + String(i + 1)).html("");
            $("#urlkouho" + String(i + 1)).attr("href", "");
        }


        response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "[0][faculty]に「" + word.value + "」をそのまま返してください。そして[1][faculty]以降にそれと関係ありそうな単語を10回いれてください",
            config: {
                responseMimeType: "application/json",
                responseSchema: schema_2
            }
        });
        jsonresponse = JSON.parse(response.text);
        console.log(jsonresponse);

        let organizations = [];

        for (let cnt = 0; cnt < haba.value; cnt++) {
            temp = jsonresponse[cnt]["faculty"];

            const query_params = new URLSearchParams({
                q: temp,
                lang: "jpn",
                format: "json",
                count: ryou.value,
                start: 1
            });
            const bookdata = await (await fetch("https://server-gtul.onrender.com:10000/cinii-proxy/opensearch/all?" + query_params)).json();

            console.log(bookdata["items"]);

            for (let i = 0; i < ryou.value; i++) {
                try {
                    let qq = bookdata["items"][i]["@id"];
                    let creatorquery = new URLSearchParams({
                        q: qq.replace(/[^0-9]/g, '')
                    });

                    let creadata = await (await fetch("https://server-gtul.onrender.com:10000/cinii-proxy/opensearch/author?" + creatorquery)).json();

                    if (creadata[0] != '') {
                        for (let l = 0; creadata[l] != ""; l++) {
                            if (!organizations.includes(creadata[l])) {
                                organizations.push(creadata[l]);
                            }
                        }
                    }
                } catch (error) {
                    i = ryou.value;
                }
            }

        }


        console.log(organizations);

        let bun = `大学の情報をを指定のJSON形式で教えてください`;

        if ((hens.value != "") | (henu.value != "")) {
            bun = "の" + bun;
            if (hens.value != "") {
                bun = hens.value + "以上" + bun;
            }
            if (henu.value != "") {
                bun = henu.value + "以下" + bun;
            }
            bun = "偏差値" + bun;
        }

        if (zyu.value != "") {
            bun = zyu.value + "にある" + bun;
        }
        bun = `次の配列の中にある${word.value}に関係する学部が存在する` + bun + "[" + organizations.toString() + "] なお重複はなくして、関係の大きい大学の順番に並べてください。";

        console.log(bun);

        response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: bun,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema_1
            }
        });
        jsonresponse = JSON.parse(response.text);
        console.log(jsonresponse);



        temp = "";
        for (let n = 0; n < jsonresponse.length; n++) {
            temp += jsonresponse[n]["sc_name"] + ","
        }
        bun = word.value + "に関係ありそうな大学とその学部を可能な限り多く条件と一致するもの調べて下さい。ただし次の配列の中にない大学のみにしてください。また数分時間がかかっても構いませんので絶対に調べ漏れがないようにしてください[" + temp + "]";

        if ((hens.value != "") | (henu.value != "")) {
            bun = "の" + bun;
            if (hens.value != "") {
                bun = hens.value + "以上" + bun;
            }
            if (henu.value != "") {
                bun = henu.value + "以下" + bun;
            }
            bun = "偏差値" + bun;
        }

        if (zyu.value != "") {
            bun = zyu.value + "にある" + bun;
        }

        console.log(bun);

        response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: bun,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema_1
            }
        });
        temp = JSON.parse(response.text);
        for (let n = 0; n < temp.length; n++) {
            jsonresponse.push(temp[n]);
        }
        console.log(jsonresponse);


        temp = 0;
        if (jsonresponse.length % 3 != 0) {
            temp = 3 - jsonresponse.length % 3;
        }
        for (let n = 0; n < temp; n++) {
            jsonresponse.push({
                sc_name: "null",
                sc_faculty: "",
                sc_info: "",
                sc_url: ""
            });
        }



        resultlength = jsonresponse.length
        resultnow = 0;
        pagess();
        for (let i = 0; i < 3; i++) {
            if (jsonresponse[i]["sc_name"] != "null") {
                $("#kouho" + String(i + 1)).html(jsonresponse[i]["sc_name"] + "<br>  " + jsonresponse[i]["sc_faculty"] + "<br>  " + jsonresponse[i]["sc_info"]);
                $("#urlkouho" + String(i + 1)).html(jsonresponse[i]["sc_url"]);
                $("#urlkouho" + String(i + 1)).attr("href", jsonresponse[i]["sc_url"]);
            }
        }

        $("#pageh").removeClass("hidden");
        $("#pagem").removeClass("hidden");
        for (let i = 0; i < 3; i++) {
            if (jsonresponse[i]["sc_name"] != "null") {
                $("#k" + String(i + 1)).removeClass("box-item3_");
                $("#k" + String(i + 1)).addClass("box-item3");
            }
        }
    } else {
        alert("入力が正しくありません\n正しい入力方法は右下のヘルプからご参照ください")
    }

});

//ページ移動処理
$("#pagem").on("click", function () {
    if (resultlength > resultnow + 3) {
        resultnow += 3;
        pagess();
        for (let i = resultnow; i < resultnow + 3; i++) {
            if (jsonresponse[i]["sc_name"] != "null") {
                $("#kouho" + String(i + 1 - resultnow)).html(jsonresponse[i]["sc_name"] + "<br>  " + jsonresponse[i]["sc_faculty"] + "<br>  " + jsonresponse[i]["sc_info"]);
                $("#urlkouho" + String(i + 1 - resultnow)).html(jsonresponse[i]["sc_url"]);
                $("#urlkouho" + String(i + 1 - resultnow)).attr("href", jsonresponse[i]["sc_url"]);
            } else {
                console.log("null");
                $("#kouho" + String(i + 1 - resultnow)).html("");
                $("#urlkouho" + String(i + 1 - resultnow)).html("");
                $("#urlkouho" + String(i + 1 - resultnow)).attr("href", "");
            }
        }
    } else {
        console.log("not");
    }
});

$("#pageh").on("click", function () {
    if (0 <= resultnow - 3) {
        resultnow -= 3;
        pagess();
        for (let i = resultnow; i < resultnow + 3; i++) {
            if (jsonresponse[i]["sc_name"] != "null") {
                $("#kouho" + String(i + 1 - resultnow)).html(jsonresponse[i]["sc_name"] + "<br>  " + jsonresponse[i]["sc_faculty"] + "<br>  " + jsonresponse[i]["sc_info"]);
                $("#urlkouho" + String(i + 1 - resultnow)).html(jsonresponse[i]["sc_url"]);
                $("#urlkouho" + String(i + 1 - resultnow)).attr("href", jsonresponse[i]["sc_url"]);
                $("#k" + String(i + 1 - resultnow)).removeClass("box-item3_")
                $("#k" + String(i + 1 - resultnow)).addClass("box-item3")
            } else {
                console.log("null");
                $("#kouho" + String(i + 1 - resultnow)).html("");
                $("#urlkouho" + String(i + 1 - resultnow)).html("");
                $("#urlkouho" + String(i + 1 - resultnow)).attr("href", "");
                $("#k" + String(i + 1 - resultnow)).removeClass("box-item3")
                $("#k" + String(i + 1 - resultnow)).addClass("box-item3_")
            }
        }
    } else {
        console.log("not");
    }
});


//ヘルプポップアップ処理
$("#open-popup-btn").on("click", function () {
    $("#popup-overlay").show()
});
$("#close-popup-btn").on("click", function () {
    $("#popup-overlay").hide()
});
$("#popup-overlay").on("click", function (event) {
    $("#popup-overlay").hide()
});