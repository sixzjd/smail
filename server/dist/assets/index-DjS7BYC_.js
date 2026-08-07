import{_ as L,o as T,D as A,c as l,b as s,g as x,j as n,u as O,l as J,B as P,k as G,W as Z,f as m,e,w as C,v as h,p as w,t as i,a1 as K,q as E,s as R,n as Q,F as X,G as Y,H as tt,a2 as et,z as M,V as st,C as at,a3 as ot,i as nt,d as $,Z as it,a4 as U}from"./index-w_dq6dkw.js";import{c as lt}from"./confirm-Ck2_nwBY.js";import{b as rt,c as ct}from"./email-3yL-VHKQ.js";import{I as f}from"./iconify-Bfa7R3Lz.js";import{u as dt}from"./email-vzi1f5NW.js";import{f as mt}from"./day-Cn8DeVcT.js";import{E as j,s as ht,a as ut}from"./star-CR9cd6Sa.js";import{f as _t,g as ft}from"./file-utils-Df0o07Ma.js";import{g as pt}from"./icon-utils-vIWADIK0.js";import{a as gt}from"./all-email-BhPOM-3q.js";import"./dayjs.min-CNuhPaIz.js";const vt={__name:"index",props:{html:{type:String,required:!0}},setup(F){const p=F,y=x(null),v=x(null);let o=null;function b(){if(!o)return;const u=/<body[^>]*style="([^"]*)"[^>]*>/i,d=p.html.match(u),_=d?d[1]:"",g=p.html.replace(/<\/?body[^>]*>/gi,"");o.innerHTML=`
    <style>
      :host {
        all: initial;
        width: 100%;
        height: 100%;
        font-family: -apple-system, Inter, BlinkMacSystemFont,
                    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: #13181D;
        word-break: break-word;
      }

      h1, h2, h3, h4 {
          font-size: 18px;
          font-weight: 700;
      }

      p {
        margin: 0;
      }

      a {
        text-decoration: none;
        color: #0E70DF;
      }

      .shadow-content {
        background: #FFFFFF;
        width: fit-content;
        height: fit-content;
        min-width: 100%;
        ${_||""} /* 注入 body 的 style */
      }

      img:not(table img) {
        max-width: 100%;
        height: auto !important;
      }

    </style>
    <div class="shadow-content">
      ${g}
    </div>
  `}function t(){if(!o||!v.value)return;const u=v.value,d=o.querySelector(".shadow-content");if(!d)return;const _=u.offsetWidth,g=d.scrollWidth;if(g===0)return;const k=_/g,S=o.host;S.style.zoom=k}return T(()=>{o=y.value.attachShadow({mode:"open"}),b(),t()}),A(()=>p.html,()=>{b(),t()}),(u,d)=>(n(),l("div",{class:"content-box",ref_key:"contentBox",ref:v},[s("div",{ref_key:"container",ref:y,class:"content-html"},null,512)],512))}},bt=L(vt,[["__scopeId","data-v-cc2b119a"]]),wt={class:"content-box"},yt={class:"content-toolbar"},kt={class:"toolbar-left"},St={class:"toolbar-right"},It={key:0,class:"toolbar-divider"},Dt={class:"content-scroll"},Ct={class:"content-inner"},Et={class:"email-subject"},Rt={class:"sender-card"},$t={class:"sender-avatar"},xt={class:"sender-meta"},Ft={class:"sender-row"},Bt={class:"sender-name"},Nt={class:"sender-addr"},zt={class:"meta-row"},Mt={class:"meta-label"},Ut={class:"meta-row"},jt={class:"meta-label"},Lt={class:"meta-value"},Tt={class:"meta-row"},At={class:"meta-value meta-date"},Ht={key:0,class:"status-banner status-banner--error"},Vt={key:1,class:"status-banner status-banner--warn"},Wt={key:2,class:"status-banner status-banner--warn"},qt={key:1,class:"email-text"},Ot={key:3,class:"attachments"},Jt={class:"att-header"},Pt={class:"att-label"},Gt={class:"att-count"},Zt={class:"att-grid"},Kt=["onClick"],Qt=["onClick","title"],Xt={class:"att-card-size"},Yt={class:"att-card-actions"},te=["href"],ee=["src"],se={__name:"index",setup(F){const p=O(),y=J(),v=P(),o=dt(),b=ot(),t=o.contentData.email,u=x(!1),d=at([]),{t:_}=G();A(()=>v.currentAccountId,()=>{N()}),T(()=>{o.contentData.showUnread&&t.unread===j.UNREAD&&(t.unread=j.READ,rt([t.emailId]))}),Z(()=>{o.contentData.showUnread=!1});function g(){p.writerRef.openReply(t)}function k(){p.writerRef.openForward(t)}function S(a){return a?JSON.parse(a).message:""}function H(a){a=a||"";const r=y.settings.r2Domain;return a.replace(/{{domain}}/g,st(r)+"/")}function I(a){if(!B(a))return;const r=U(a);d.length=0,d.push(r),u.value=!0}function B(a){return["png","jpg","jpeg","bmp","gif","jfif"].includes(ft(a))}function V(a){return a=JSON.parse(a),a.map(r=>r.address).join(", ")}function W(){t.isStar?(t.isStar=0,ht(t.emailId).then(()=>{t.isStar=0,o.cancelStarEmailId=t.emailId,setTimeout(()=>o.cancelStarEmailId=0),o.starScroll?.deleteEmail([t.emailId])}).catch(a=>{console.error(a),t.isStar=1})):(t.isStar=1,ut(t.emailId).then(()=>{t.isStar=1,o.addStarEmailId=t.emailId,setTimeout(()=>o.addStarEmailId=0),o.starScroll?.addItem(t)}).catch(a=>{console.error(a),t.isStar=0}))}const N=()=>{b.back()},q=async()=>{await lt(_("delEmailConfirm"),_("confirm"))&&(o.contentData.delType==="logic"?ct(t.emailId).then(()=>{M(_("delSuccessMsg"),"success"),o.deleteIds=[t.emailId]}):gt(t.emailId).then(()=>{M(_("delSuccessMsg"),"success"),o.deleteIds=[t.emailId]}),b.back())};return(a,r)=>{const D=nt("perm");return n(),l("div",wt,[s("div",yt,[s("div",kt,[s("button",{class:"toolbar-btn",onClick:N,"aria-label":"Back"},[m(e(f),{icon:"material-symbols-light:arrow-back-ios-new",width:"18",height:"18"})])]),s("div",St,[C((n(),l("button",{class:"toolbar-btn",onClick:q,"aria-label":"Delete"},[m(e(f),{icon:"uiw:delete",width:"15",height:"15"})])),[[D,"email:delete"]]),e(o).contentData.showStar?(n(),l("span",It)):h("",!0),e(o).contentData.showStar?(n(),l("button",{key:1,class:"toolbar-btn toolbar-star",onClick:W,"aria-label":"Star"},[e(t).isStar?(n(),w(e(f),{key:0,icon:"fluent-color:star-16",width:"18",height:"18"})):(n(),w(e(f),{key:1,icon:"solar:star-line-duotone",width:"16",height:"16"}))])):h("",!0),e(o).contentData.showReply?C((n(),l("button",{key:2,class:"toolbar-btn",onClick:g,"aria-label":"Reply"},[m(e(f),{icon:"la:reply",width:"18",height:"18"})])),[[D,"email:send"]]):h("",!0),e(o).contentData.showReply?C((n(),l("button",{key:3,class:"toolbar-btn",onClick:k,"aria-label":"Forward"},[m(e(f),{icon:"iconoir:arrow-up-right",width:"17",height:"17"})])),[[D,"email:send"]]):h("",!0)])]),s("div",Dt,[s("div",Ct,[s("h1",Et,i(e(t).subject),1),s("div",Rt,[s("div",$t,[m(K,{alt:e(t).name||e(t).sendEmail,size:"lg"},null,8,["alt"])]),s("div",xt,[s("div",Ft,[s("span",Bt,i(e(t).name),1),s("span",Nt,"<"+i(e(t).sendEmail)+">",1)]),s("div",zt,[s("span",Mt,i(a.$t("from")),1)]),s("div",Ut,[s("span",jt,i(a.$t("recipient")),1),s("span",Lt,i(V(e(t).recipient)),1)]),s("div",Tt,[s("span",At,i(e(mt)(e(t).createTime)),1)])])]),e(t).status===3?(n(),l("div",Ht,[m(R,{type:"danger"},{default:E(()=>[...r[3]||(r[3]=[$("Error",-1)])]),_:1}),s("span",null,i(S(e(t).message)),1)])):h("",!0),e(t).status===4?(n(),l("div",Vt,[m(R,{type:"warning"},{default:E(()=>[$(i(a.$t("complained")),1)]),_:1})])):h("",!0),e(t).status===5?(n(),l("div",Wt,[m(R,{type:"warning"},{default:E(()=>[$(i(a.$t("delayed")),1)]),_:1})])):h("",!0),s("div",{class:Q(["email-body",{"email-body--no-att":e(t).attList.length===0}])},[e(t).content?(n(),w(bt,{key:0,class:"email-html",html:H(e(t).content)},null,8,["html"])):(n(),l("pre",qt,i(e(t).text),1))],2),e(t).attList.length>0?(n(),l("div",Ot,[s("div",Jt,[s("span",Pt,i(a.$t("attachments")),1),s("span",Gt,i(a.$t("attCount",{total:e(t).attList.length})),1)]),s("div",Zt,[(n(!0),l(X,null,Y(e(t).attList,c=>(n(),l("div",{class:"att-card",key:c.attId},[s("div",{class:"att-card-icon",onClick:z=>I(c.key)},[m(e(f),it({ref_for:!0},e(pt)(c.filename)),null,16)],8,Kt),s("div",{class:"att-card-name",onClick:z=>I(c.key),title:c.filename},i(c.filename),9,Qt),s("div",Xt,i(e(_t)(c.size)),1),s("div",Yt,[B(c.filename)?(n(),w(e(f),{key:0,icon:"hugeicons:view",width:"18",height:"18",onClick:z=>I(c.key)},null,8,["onClick"])):h("",!0),s("a",{href:e(U)(c.key),download:""},[m(e(f),{icon:"system-uicons:push-down",width:"18",height:"18"})],8,te)])]))),128))])])):h("",!0)])]),(n(),w(et,{to:"body"},[u.value?(n(),l("div",{key:0,class:"img-preview-mask",onClick:r[2]||(r[2]=c=>u.value=!1)},[s("button",{class:"img-preview-close",onClick:r[0]||(r[0]=c=>u.value=!1)},"×"),s("img",{src:d[0],class:"img-preview-img",onClick:r[1]||(r[1]=tt(()=>{},["stop"]))},null,8,ee)])):h("",!0)]))])}}},_e=L(se,[["__scopeId","data-v-57e42acd"]]);export{_e as default};
