require("dotenv").config();
const firebase = require("firebase");
const Telegraf = require("telegraf");
const Markup = require("telegraf/markup");
const Extra = require("telegraf/extra");
const session = require("telegraf/session");
const admin = require("firebase-admin");
const serviceAccount = require('./ServiceAccountKey.json');
const firebaseConfig = require('./firebaseCredentials');
/*---------------------------------FIREBASE SETUP-------------------------------------------------------------*/
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: firebaseConfig.databaseURL,
});

firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
const db = admin.firestore();

/*-----------------------------BOT ON START------------------------------------------------------------------*/
const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start(ctx => {
    console.log(ctx.message.from.username + " ha interrogato il bot");
    ctx.replyWithHTML(`\<b>ISTRUZIONI:</b>
<i>Per iniziare una segnalazione digita</i> /report
<i>Puoi segnalare con messaggi di testo, foto, video,registrazioni vocali </i>
<i>Non spammare o verrai</i><b> bannato subito</b>`);
});
const Stage = require("telegraf/stage");
const Scene = require("telegraf/scenes/base");
const {
    leave
} = Stage;

// msg to forward
var msg = {};
/*----------------------------REPORT SCENE -------------------------------------------*/
const report = new Scene("report");
report.enter(ctx =>
    ctx.reply("Adesso posso segnalare al gruppo La Staffa e si riparte 2.0")
);
report.leave(ctx => ctx.reply("Grazie, a presto"));

report.on("message", (ctx, next) => {
    msg = ctx.message;

    ctx.session.counter = ctx.session.counter || 0;
    ctx.session.counter += 1;

    console.log(`${ctx.session.counter}`);
    if (ctx.session.counter > 3) {
        let data = ctx.message;
        db.collection("BLACK LIST")
            .doc("ban")
            .set(data)
            .catch(err => {
                console.log(err);
            });
        ctx.scene.leave();
        console.log(ctx.message.from.username + " è stato appena bannato");
        return ctx.reply("SEI STATO BANNATO. NON PUOI PIU SEGNALARE");
    } else {
        return ctx.reply(
            "Sei sicuro?",

            Markup.inlineKeyboard([
                Markup.callbackButton("Si", "si"), // button name - Action

                Markup.callbackButton("No", "no"), //button name - Action
            ]).extra()
        );
    }
});
report.action(
    "si",
    (ctx, next) => {
        let blacklist = db
            .collection("BLACK LIST")
            .get("ban")
            .then(snapshot => {
                snapshot.forEach(doc => {
                    if (doc.data().from.id == msg.id) {
                        ctx.scene.leave();
                        return ctx.reply("BAnnato");
                    }
                });
                next();
            })

        .catch(err => {
            console.log("Error getting documents", err);
        });

        ctx.answerCbQuery(`Oh, messaggio inoltrato al gruppo`);
    },
    (ctx, next) => {
        ctx.scene.leave();
        return ctx.telegram.sendCopy(process.env.GROUP_CHAT_ID_TO_SEND, msg);
    }
);
//get data

report.action("no", ctx => {
    ctx.answerCbQuery(`Oh, puoi riprovare...!`);
    return ctx.scene.leave();
});
// Create scene manager
const stage = new Stage();
stage.command("cancel", leave());

// Scene registration
stage.register(report);
/*---------------BOT ACTIONS------------------------------------*/
bot.use(session());
bot.use(stage.middleware());
bot.command("report", ctx => ctx.scene.enter("report"));
bot.on("new_chat_members", ctx => {

});
bot.on("left_chat_member", ctx => {

});


bot.on("message", ctx => {
    ctx.reply("devi usare prima il comando /report");
});

bot.launch();

// let blacklist = db.collection('BLACK LIST').get()
//     .then((snapshot) => {
//         snapshot.forEach((doc) => {
//             console.log('cercando i dati...')
//             if (doc.data().from.id == msg.from.id) {

//                 console.log('Utente trovato a spammare...');
//                 return ctx.reply('BANNATO');
//             } else {

//                 console.log('utente pulito')
//                 return ctx.telegram.sendCopy(process.env.GROUP_CHAT_ID_TO_SEND, msg);
//             }

//         });
//     })
//     .catch((err) => {
//         console.log('Error getting documents', err);
//     });

// if (doc.data().from.id == msg.from.id) {

//                     console.log('Utente trovato a spammare...');
//                     return ctx.reply('BANNATO');
//                 } else {

//                      console.log('utente pulito')
//                      return ctx.telegram.sendCopy(process.env.GROUP_CHAT_ID_TO_SEND, msg);
//                }

// Text messages handling
// report.on(
//     "message",
//     (ctx, next) => {
//         for (var obj of BAN) {
//             if (obj == ctx.message.from.id) return reply("NON OUOI PIU SEGNALARE");
//         }
//         console.log("sending report...");
//         ctx.session.counter = ctx.session.counter || 0;
//         ctx.session.counter += 1;
//         console.log(`${ctx.session.counter}`);
//         if (ctx.session.counter == 3) {
//             let banId = ctx.message.from.id;
//             console.log(typeof banId);
//             BAN.push(banId);
//             ctx.reply("SEI STATO BANNATO. NON PUOI piu SEGNALARE");
//         } else {
//             msg = ctx.message;

//             next();
//         }
//     },
//     (ctx, next) => {
//         ctx.reply(
//             "Sei sicuro?",
//             Markup.inlineKeyboard([
//                 Markup.callbackButton("Si", "si"), // button name - Action

//                 Markup.callbackButton("No", "no"), //button name - Action
//             ]).extra()
//         );
//         next();
//     },
//     (ctx, next) => {
//         ctx.scene.leave();
//     }
// );

// let data = ctx.message;
// db.collection('BLACK LIST').add(data).then(doc => {}).catch(err => {
//     console.log(err);
//     process.exit();
// });