import re
import os
import json
from ..config.db import db
from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain.prompts import ChatPromptTemplate
from langchain_deepseek import ChatDeepSeek
from src.services.get_embedding_function import get_embedding_function

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CHROMA_PATH = os.path.join(BASE_DIR, "../data/data/chroma_dharashiv")
METADATA_PATH = os.path.join(BASE_DIR, "../data/data/metadata.json")



PROMPT_TEMPLATE = """
तुम्हाला खालील संदर्भ वापरून प्रश्नाचे उत्तर द्यायचे आहे:

{context}

---
प्रश्न: {question}

उत्तर देण्याचे नियम:
1. संदर्भातील सर्वात संबंधित माहिती निवडा
2. नेहमी GR क्रमांक, दिनांक आणि विभाग स्पष्टपणे नवीन ओळीवर दाखवा
3. जर संदर्भात प्रश्नाशी संबंधित माहिती नसेल तर "ही माहिती उपलब्ध नाही" असे सांगा
4. उत्तर नेहमी शुद्ध मराठीत आणि आकर्षक स्वरूपात द्या

उत्तराचे स्वरूप:
तुम्ही खालील माहितीच्या आधारे तुमचा प्रश्न सोडवू शकता:

GR क्रमांक: [GR_NUMBER]

दिनांक: [DATE]

विभाग: [DEPARTMENT]

मजकूर:

[RELEVANT_CONTENT]
"""

def load_metadata():
    with open(METADATA_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def extract_unique_code_or_gr_number(query):
    unique_code_match = re.search(r'सांकेतांक\s*क्रमांक[:\-]?\s*(\d{18})', query)
    gr_number_match = re.search(r'शासन निर्णय क्रमांक[:\-]?\s*([^\n\r]+)', query)
    unique_code = unique_code_match.group(1) if unique_code_match else None
    gr_number = gr_number_match.group(1).strip() if gr_number_match else None
    return unique_code, gr_number

def find_metadata_entry(unique_code, gr_number, metadata):
    for entry in metadata:
        if unique_code and entry.get("unique_code") == unique_code:
            return entry
        if gr_number and entry.get("gr_number") == gr_number:
            return entry
    return None

def build_modified_query(entry):
    return (
        f"कृपया खालील शासन निर्णयाचा सविस्तर सारांश द्या:\n\n"
        f"GR क्रमांक: {entry['gr_number']}\n"
        f"विभाग: {entry['department']}\n"
        f"दिनांक: {entry.get('date', 'UNKNOWN')}\n"
        f"शिर्षक: {entry['title']}\n"
        f"युनिक कोड: {entry['unique_code']}"
    )


# Add this new function to check question associations
async def get_associated_questions(user_id: str, current_query: str, session_id):
    """
    Check if current question is associated with previous questions in the database.
    Returns combined context if association found, otherwise None.
    """
    try:
        # Get all previous questions for this user
        session = await db.sessions.find_one(
            {"_id": session_id,"userId": user_id, "isDeleted": False},
            sort=[("updatedAt", -1)]  # Get most recent session
        )
        
        if not session:
            return None
            
        previous_entries = session.get("entries", [])
        
        # Check for association with any previous question
        associated_queries = []
        for entry in previous_entries:
            prev_query = entry.get("query_text", "")
            prev_response = entry.get("response_text", "")
            
            # Simple similarity check (you might want to enhance this)
            if (current_query.lower() in prev_query.lower() or 
                prev_query.lower() in current_query.lower() or
                any(word in current_query.lower() for word in prev_query.lower().split()[:5])):
                
                associated_queries.append({
                    "previous_question": prev_query,
                    "previous_response": prev_response
                })
        
        if associated_queries:
            # Build combined context
            combined_context = "संदर्भासाठी पुढील मागील प्रश्न आणि त्यांची उत्तरे:\n\n"
            for idx, item in enumerate(associated_queries, 1):
                combined_context += (
                    f"{idx}. मागील प्रश्न: {item['previous_question']}\n"
                    f"   मागील उत्तर: {item['previous_response']}\n\n"
                )
            
            combined_context += f"वर्तमान प्रश्न: {current_query}\n\n"
            return combined_context
        
        return None
        
    except Exception as e:
        print(f"Error checking question associations: {str(e)}")
        return None






PROMPT_TEMPLATE = """
तुम्हाला खालील संदर्भ वापरून प्रश्नाचे उत्तर द्यायचे आहे:

{context}

---
प्रश्न: {question}

उत्तर देण्याचे नियम:
1. संदर्भातील सर्वात संबंधित माहिती निवडा
2. नेहमी GR क्रमांक, दिनांक आणि विभाग स्पष्टपणे नवीन ओळीवर दाखवा
3. जर संदर्भात प्रश्नाशी संबंधित माहिती नसेल तर "ही माहिती उपलब्ध नाही" असे सांगा
4. उत्तर नेहमी शुद्ध मराठीत आणि आकर्षक स्वरूपात द्या
5. जर session_id उपलब्ध नसेल तर, प्रश्नावर आधारित एक योग्य शीर्षक निर्माण करा

उत्तराचे स्वरूप:
तुम्ही खालील माहितीच्या आधारे तुमचा प्रश्न सोडवू शकता:

GR क्रमांक: [GR_NUMBER]

दिनांक: [DATE]

विभाग: [DEPARTMENT]

मजकूर:

[RELEVANT_CONTENT]

{title_section}
"""

def generate_title_prompt(session_id):
    if session_id == "new":
        return "\nशीर्षक: [प्रश्नावर आधारित योग्य शीर्षक तयार करा]"
    return ""

async def query_gr(original_query: str, user_id: str = None, session_id=None, stream: bool = False):
    try:
        print("this is the data i got from ui,",user_id)
        print("this is the data i got from ui,",session_id)
        print("this is the data i got from ui,",original_query)
        
        
        metadata = load_metadata()
        unique_code, gr_number = extract_unique_code_or_gr_number(original_query)

        # Check for associated questions if user_id and db_client are provided
        combined_context = None
        if user_id :
            combined_context = await get_associated_questions(user_id, original_query, session_id)

        if any(word in original_query for word in ['सारांश', 'संक्षेप', 'संक्षिप्त']):
            matched_entry = find_metadata_entry(unique_code, gr_number, metadata)
            refined_query = build_modified_query(matched_entry) if matched_entry else original_query
        else:
            refined_query = original_query

        if gr_number:
            matching_meta = [m for m in metadata if m.get("gr_number") and gr_number in m["gr_number"]]
            if matching_meta:
                refined_query = f"GR क्रमांक {gr_number} बाबतचा संपूर्ण मजकूर"

        embedding_function = get_embedding_function()
        db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)

        # If we have combined context from previous questions, use that as the query
        final_query = f"{combined_context}\n\n{refined_query}" if combined_context else refined_query
        
        results = db.similarity_search_with_score(final_query, k=3)

        if not results:
            response = {
                "status": "success",
                "response": "माफ करा, ही माहिती उपलब्ध नाही.",
                "sources": [],
                "done": True
            }
            if not session_id:
                response["title"] = f"प्रश्न: {original_query[:50]}..."  # Generate simple title from query
            if stream:
                yield response
                return
            else:
                yield response
                return

        context_parts = []
        sources = []
        for doc, score in results:
            context_parts.append(
                f"GR क्रमांक: {doc.metadata.get('gr_number', 'UNKNOWN')}\n"
                f"विभाग: {doc.metadata.get('department', 'UNKNOWN')}\n"
                f"दिनांक: {doc.metadata.get('date', 'UNKNOWN')}\n"
                f"मजकूर:\n{doc.page_content[:1500]}\n"
                f"संबंधितता स्कोअर: {score:.2f}\n---\n"
            )
            sources.append({
                "id": doc.metadata.get("id", None),
                "unique_code": doc.metadata.get("unique_code", "UNKNOWN"),
                "gr_number": doc.metadata.get("gr_number", "UNKNOWN")
            })

        context_text = "".join(context_parts)
        
        # Include combined context in the prompt if available
        full_context = f"{combined_context}\n\n{context_text}" if combined_context else context_text
        
        # Add title generation instruction to prompt if no session_id
        title_prompt = generate_title_prompt(session_id)
        prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
        prompt = prompt_template.format(context=full_context, question=final_query, title_section=title_prompt)

        model = ChatDeepSeek(
            model="deepseek-chat",
            temperature=0,
            max_tokens=1500,
            timeout=None,
            max_retries=2,
            api_key=os.getenv("DEEPSEEK_API_KEY"),
            streaming=True
        )

        if stream:
            full_response = ""
            title = None
            async for chunk in model.astream(prompt):
                chunk_content = chunk.content
                full_response += chunk_content
                
                # Extract title from response if it exists and session_id is not provided
                if session_id == "new" and "शीर्षक:" in chunk_content and not title:
                    title_start = chunk_content.find("शीर्षक:") + len("शीर्षक:")
                    title_end = chunk_content.find("\n", title_start)
                    title = chunk_content[title_start:title_end].strip()
                
                yield {
                    "status": "streaming",
                    "response": chunk_content,
                    "sources": [],
                    "done": False,
                    **({"title": title} if title and not session_id == "new" else {})
                }
            
            yield {
                "status": "success",
                "response": full_response.strip(),
                "sources": sources,
                "done": True,
                **({"title": title} if title and not session_id else {})
            }
        else:
            full_response = ""
            async for chunk in model.astream(prompt):
                full_response += chunk.content
            
            # Extract title from full response if session_id is not provided
            title = None
            if not session_id and "शीर्षक:" in full_response:
                title_start = full_response.find("शीर्षक:") + len("शीर्षक:")
                title_end = full_response.find("\n", title_start)
                title = full_response[title_start:title_end].strip()
            
            yield {
                "status": "success",
                "response": full_response.strip(),
                "sources": sources,
                "done": True,
                **({"title": title} if title and not session_id else {})
            }

    except Exception as e:
        yield {
            "status": "error",
            "response": str(e),
            "sources": [],
            "done": True
        }

####working code before title generation
# Modify your query_gr function to include this check
# async def query_gr(original_query: str,  user_id: str =None, session_id=None,stream: bool = False):
#     try:
#         # user_id="6874b3c6f46dd38c4d07efef"
#         print("this is user id",user_id)
#         print("this is db_client",db)
#         metadata = load_metadata()
#         unique_code, gr_number = extract_unique_code_or_gr_number(original_query)

#         # Check for associated questions if user_id and db_client are provided
#         combined_context = None
#         if user_id and db:
#             combined_context = await get_associated_questions(user_id, original_query, session_id,db,)
        
#         if any(word in original_query for word in ['सारांश', 'संक्षेप', 'संक्षिप्त']):
#             matched_entry = find_metadata_entry(unique_code, gr_number, metadata)
#             refined_query = build_modified_query(matched_entry) if matched_entry else original_query
#         else:
#             refined_query = original_query

#         if gr_number:
#             matching_meta = [m for m in metadata if m.get("gr_number") and gr_number in m["gr_number"]]
#             if matching_meta:
#                 refined_query = f"GR क्रमांक {gr_number} बाबतचा संपूर्ण मजकूर"

#         embedding_function = get_embedding_function()
#         db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)

#         # If we have combined context from previous questions, use that as the query
#         final_query = f"{combined_context}\n\n{refined_query}" if combined_context else refined_query
        
#         results = db.similarity_search_with_score(final_query, k=3)

#         if not results:
#             if stream:
#                 yield {
#                     "status": "success",
#                     "response": "माफ करा, ही माहिती उपलब्ध नाही.",
#                     "sources": [],
#                     "done": True
#                 }
#                 return
#             else:
#                 yield {
#                     "status": "success",
#                     "response": "माफ करा, ही माहिती उपलब्ध नाही.",
#                     "sources": [],
#                     "done": True
#                 }
#                 return

#         context_parts = []
#         sources = []
#         for doc, score in results:
#             context_parts.append(
#                 f"GR क्रमांक: {doc.metadata.get('gr_number', 'UNKNOWN')}\n"
#                 f"विभाग: {doc.metadata.get('department', 'UNKNOWN')}\n"
#                 f"दिनांक: {doc.metadata.get('date', 'UNKNOWN')}\n"
#                 f"मजकूर:\n{doc.page_content[:1500]}\n"
#                 f"संबंधितता स्कोअर: {score:.2f}\n---\n"
#             )
#             sources.append({
#                 "id": doc.metadata.get("id", None),
#                 "unique_code": doc.metadata.get("unique_code", "UNKNOWN"),
#                 "gr_number": doc.metadata.get("gr_number", "UNKNOWN")
#             })

#         context_text = "".join(context_parts)
        
#         # Include combined context in the prompt if available
#         full_context = f"{combined_context}\n\n{context_text}" if combined_context else context_text
        
#         prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
#         prompt = prompt_template.format(context=full_context, question=final_query)

#         model = ChatDeepSeek(
#             model="deepseek-chat",
#             temperature=0,
#             max_tokens=1500,
#             timeout=None,
#             max_retries=2,
#             api_key=os.getenv("DEEPSEEK_API_KEY"),
#             streaming=True
#         )

#         if stream:
#             full_response = ""
#             async for chunk in model.astream(prompt):
#                 chunk_content = chunk.content
#                 full_response += chunk_content
#                 yield {
#                     "status": "streaming",
#                     "response": chunk_content,
#                     "sources": [],
#                     "done": False
#                 }
            
#             yield {
#                 "status": "success",
#                 "response": full_response.strip(),
#                 "sources": sources,
#                 "done": True
#             }
#         else:
#             full_response = ""
           
#             async for chunk in model.astream(prompt):
#                 full_response += chunk.content
            
#             yield {
#                 "status": "success",
#                 "response": full_response.strip(),
#                 "sources": sources,
#                 "done": True
#             }

#     except Exception as e:
#         yield {
#             "status": "error",
#             "response": str(e),
#             "sources": [],
#             "done": True
#         }


        
# # async def query_gr(original_query: str, stream: bool = False):
#     try:
    #     metadata = load_metadata()
    #     unique_code, gr_number = extract_unique_code_or_gr_number(original_query)

    #     if any(word in original_query for word in ['सारांश', 'संक्षेप', 'संक्षिप्त']):
    #         matched_entry = find_metadata_entry(unique_code, gr_number, metadata)
    #         refined_query = build_modified_query(matched_entry) if matched_entry else original_query
    #     else:
    #         refined_query = original_query

        
    #     if gr_number:
    #         matching_meta = [m for m in metadata if m.get("gr_number") and gr_number in m["gr_number"]]
    #         if matching_meta:
    #             refined_query = f"GR क्रमांक {gr_number} बाबतचा संपूर्ण मजकूर"

    #     embedding_function = get_embedding_function()
    #     db = Chroma(persist_directory=CHROMA_PATH, embedding_function=embedding_function)

    #     results = db.similarity_search_with_score(refined_query, k=3)

    #     if not results:
    #         if stream:
    #             yield {
    #                 "status": "success",
    #                 "response": "माफ करा, ही माहिती उपलब्ध नाही.",
    #                 "sources": [],
    #                 "done": True
    #             }
    #             return
    #         else:
    #             yield {
    #                 "status": "success",
    #                 "response": "माफ करा, ही माहिती उपलब्ध नाही.",
    #                 "sources": [],
    #                 "done": True
    #             }
    #             return

    #     context_parts = []
    #     sources = []
    #     for doc, score in results:
    #         context_parts.append(
    #             f"GR क्रमांक: {doc.metadata.get('gr_number', 'UNKNOWN')}\n"
    #             f"विभाग: {doc.metadata.get('department', 'UNKNOWN')}\n"
    #             f"दिनांक: {doc.metadata.get('date', 'UNKNOWN')}\n"
    #             f"मजकूर:\n{doc.page_content[:1500]}\n"
    #             f"संबंधितता स्कोअर: {score:.2f}\n---\n"
    #         )
    #         sources.append({
    #             "id": doc.metadata.get("id", None),
    #             "unique_code": doc.metadata.get("unique_code", "UNKNOWN"),
    #             "gr_number": doc.metadata.get("gr_number", "UNKNOWN")
    #         })

    #     context_text = "".join(context_parts)
    #     prompt_template = ChatPromptTemplate.from_template(PROMPT_TEMPLATE)
    #     prompt = prompt_template.format(context=context_text, question=refined_query)

    #     model = ChatDeepSeek(
    #         model="deepseek-chat",
    #         temperature=0,
    #         max_tokens=1500,
    #         timeout=None,
    #         max_retries=2,
    #         api_key=os.getenv("DEEPSEEK_API_KEY"),
    #         streaming=True
    #     )

    #     if stream:
    #         full_response = ""
    #         async for chunk in model.astream(prompt):
    #             chunk_content = chunk.content
    #             full_response += chunk_content
    #             yield {
    #                 "status": "streaming",
    #                 "response": chunk_content,
    #                 "sources": [],
    #                 "done": False
    #             }
            
          
    #         yield {
    #             "status": "success",
    #             "response": full_response.strip(),
    #             "sources": sources,
    #             "done": True
    #         }
    #     else:
    #         full_response = ""
           
    #         async for chunk in model.astream(prompt):
    #             full_response += chunk.content
            
            
    #         yield {
    #             "status": "success",
    #             "response": full_response.strip(),
    #             "sources": sources,
    #             "done": True
    #         }

    # except Exception as e:
    #     yield {
    #         "status": "error",
    #         "response": str(e),
    #         "sources": [],
    #         "done": True
    #     }