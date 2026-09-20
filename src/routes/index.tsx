import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Play, Menu, X } from "lucide-react";
import { useState } from "react";
import bg from "@/assets/bell-cinematic-bg.jpg";
import demo from "@/assets/bell-demo-visual.jpg";
import { BellLogo } from "@/components/bell-logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head:()=>({meta:[{title:"BELL — Trade only when the session is honest"},{name:"description",content:"BELL fails closed when tokenized-stock reference prices are stale, halted, or outside the underlying market session."},{property:"og:title",content:"BELL — Closed-session honesty"},{property:"og:description",content:"Know when a tokenized-stock trade is honest before it reaches your wallet."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}),
  component: Home,
});
function Home(){const [menu,setMenu]=useState(false);return <main className="home-viewport"><section className="home-screen"><img className="home-background" src={bg} width={1920} height={1080} alt="Monumental exchange bell at night"/><div className="home-vignette"/>
<header className={`home-header ${menu?"menu-open":""}`}><BellLogo/><div className="home-actions"><nav><Link to="/" activeOptions={{exact:true}}>Home</Link><Link to="/about">About</Link><Link to="/markets">Markets</Link><Link to="/dx-report">DX report</Link></nav><div className="time-panel"><span>Underlying session</span><strong>Closed · Fri 22:00 UTC</strong></div><Button asChild variant="light"><Link to="/desk">Open desk</Link></Button></div><Button variant="glass" size="icon-lg" className="home-menu" aria-label="Toggle navigation" onClick={()=>setMenu(v=>!v)}>{menu?<X/>:<Menu/>}</Button></header>
<div className="home-content"><h1 className="home-title"><span className="title-clip"><span className="title-line title-line-one">Trade only when</span></span><span className="title-clip"><span className="title-line title-line-two">the session is honest.</span></span></h1><p className="home-copy">Tokenized stocks trade after Wall Street closes.<br/>BELL checks the real session, exposes the gap,<br/>and stops the order before your wallet signs.</p><Button asChild variant="light" size="hero"><Link to="/desk"><span>Try the honest desk</span><span className="arrow-box"><ArrowUpRight/></span></Link></Button></div>
<article className="demo-card"><div className="demo-visual"><img src={demo} width={1024} height={1024} alt="Red and blue smoke around an exchange bell"/><Button variant="glass" size="play" aria-label="Play BELL demo"><Play fill="currentColor"/></Button><div className="demo-signal"><span className="status-dot status-closed"/>Session closed</div></div><Button asChild variant="glass" className="watch-button"><Link to="/desk">Watch the 8-second gate <ArrowUpRight/></Link></Button></article>
</section></main>}
